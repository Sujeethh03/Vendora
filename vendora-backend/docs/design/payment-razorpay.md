# Payment Integration (Razorpay) — Design Document

## Overview

This feature wires up Razorpay into the existing checkout flow.  
Currently, `POST /orders` creates an order with status `confirmed` without collecting payment.  
After this change:
- Order is created with status `pending_payment`
- A Razorpay order is created server-side and its ID is returned to the frontend
- The frontend opens the Razorpay checkout modal
- On payment success, the frontend sends the payment credentials to the backend for signature verification
- Backend verifies the HMAC signature and transitions the order to `confirmed`
- On payment failure, `payment_failed_at` is set but the order stays `pending_payment` — the user can retry within 30 minutes
- On dismissal, the order stays `pending_payment` unchanged — the user can retry
- Orders not resolved within 30 minutes are expired by a background job, which restores stock

---

## Payment Flow

```
Checkout page
  └── User fills delivery address, clicks "Pay Now"
        └── POST /orders
              ├── Backend creates Order (status: pending_payment)
              ├── Backend creates Razorpay order via Razorpay API
              ├── Stores razorpay_order_id on the Order row
              └── Returns: { order_id, razorpay_order_id, amount, currency, key_id }
                    └── Frontend opens Razorpay checkout modal
                          ├── Payment success
                          │     └── POST /payments/verify
                          │           ├── Backend verifies HMAC signature
                          │           ├── Stores razorpay_payment_id + signature
                          │           ├── Updates order status → confirmed
                          │           └── Returns: { order_id }
                          │                 └── Redirect to /orders/{order_id}
                          ├── Payment failure (Razorpay fires payment.failed webhook)
                          │     └── Backend sets payment_failed_at, status stays pending_payment
                          │           └── Orders page shows "Complete Payment" CTA
                          │                 └── POST /payments/retry/{order_id}
                          │                       └── Clears payment_failed_at, new razorpay_order_id
                          │                             └── Re-opens modal
                          └── Modal dismissed (no webhook fired)
                                └── Toast: "Payment cancelled."
                                      └── "Retry Payment" button → POST /payments/retry/{order_id}
```

---

## Database

### Changes to `orders` table

Add six new columns:

| Column                  | Type          | Constraints                                                          |
|-------------------------|---------------|----------------------------------------------------------------------|
| `razorpay_order_id`     | VARCHAR(64)   | nullable, unique (indexed — see migration)                           |
| `razorpay_payment_id`   | VARCHAR(64)   | nullable                                                             |
| `razorpay_signature`    | VARCHAR(128)  | nullable                                                             |
| `payment_failed_at`     | TIMESTAMP TZ  | nullable — set when Razorpay fires payment.failed                    |
| `paid_at`               | TIMESTAMP TZ  | nullable — set when order transitions to confirmed                   |
| `expires_at`            | TIMESTAMP TZ  | NOT NULL — set to `created_at + 30 min`; reset to `now + 30 min` on each retry |

`razorpay_order_id` has a `UNIQUE` constraint; PostgreSQL automatically creates a B-tree index on it, so webhook lookups by this column are fast with no extra index needed.

Update `status` semantics:

| Status            | Meaning                                                                            |
|-------------------|------------------------------------------------------------------------------------|
| `pending_payment` | Order created, stock reserved — awaiting payment (may have had a failed attempt)   |
| `confirmed`       | Payment verified by HMAC check + amount cross-check                                |
| `expired`         | Not paid within 30 min (or failed and not retried) — expiry job restores stock     |

`cancelled` is removed. `payment.failed` no longer moves the order out of `pending_payment` — see webhook section.

The default value of `status` changes from `confirmed` to `pending_payment`.

### Alembic Migration

One migration:
- `ALTER TABLE orders ADD COLUMN razorpay_order_id VARCHAR(64) UNIQUE`
- `ALTER TABLE orders ADD COLUMN razorpay_payment_id VARCHAR(64)`
- `ALTER TABLE orders ADD COLUMN razorpay_signature VARCHAR(128)`
- `ALTER TABLE orders ADD COLUMN payment_failed_at TIMESTAMPTZ`
- `ALTER TABLE orders ADD COLUMN paid_at TIMESTAMPTZ`
- `ALTER TABLE orders ADD COLUMN expires_at TIMESTAMPTZ NOT NULL DEFAULT now() + interval '30 minutes'`
- `ALTER TABLE orders ALTER COLUMN status SET DEFAULT 'pending_payment'`
- `CREATE UNIQUE INDEX ix_orders_razorpay_order_id ON orders (razorpay_order_id)` — the `UNIQUE` constraint creates this automatically in PostgreSQL, but declaring it explicitly in the migration makes the intent clear and ensures it exists even if the constraint is later altered

The index on `razorpay_order_id` is load-bearing: every `payment.captured` and `payment.failed` webhook hits this lookup. Confirm it is present before going to production (`\d orders` in psql).

---

## Backend

### Environment Variables

```
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
RAZORPAY_WEBHOOK_SECRET=...   # separate secret set in Razorpay dashboard
```

### New / Modified API Endpoints

| Method | Path                          | Auth     | Description                                     |
|--------|-------------------------------|----------|-------------------------------------------------|
| `POST` | `/orders`                     | buyer    | **Modified** — creates order + Razorpay order   |
| `POST` | `/payments/verify`            | buyer    | Verify payment signature, confirm order         |
| `POST` | `/payments/retry/{order_id}`  | buyer    | Re-create Razorpay order for a pending payment  |
| `POST` | `/payments/webhook`           | none     | Razorpay webhook (HMAC-verified by header)      |

---

### `POST /orders` — Modified Response

Request body is unchanged (delivery address only).

**Response:**
```json
{
  "order_id": "uuid",
  "razorpay_order_id": "order_XXXXXXXXXX",
  "amount": 149700,
  "currency": "INR",
  "key_id": "rzp_test_..."
}
```

`amount` is in paise (multiply `total_amount` × 100, rounded to integer).

**Business logic changes:**
1. Validate stock for all cart items (same check as before)
2. Create `Order` row with `status = pending_payment`, set `expires_at = now + 30 minutes`
3. **Decrement `product.stock` immediately** — stock is reserved at order creation, not at payment confirmation
4. Clear the cart
5. **`COMMIT`** — the order and stock changes are persisted before the external call
6. Call Razorpay API: `razorpay_client.order.create({ amount, currency: "INR", receipt: str(order.id) })`
7. Store `razorpay_order_id` on the order row and `COMMIT` again
8. Return the `CheckoutSessionOut` response

**Razorpay API failure handling:**

Steps 5 and 6 cannot be in the same DB transaction — the external HTTP call happens after the commit. If step 6 fails, stock is already decremented and the order row exists. Restore explicitly:

```python
try:
    rzp_order = razorpay_client.order.create(...)
except Exception:
    # External call failed — clean up the committed row manually
    for item in order.items:
        await db.execute(
            update(Product)
            .where(Product.id == item.product_id)
            .values(stock=Product.stock + item.quantity)
        )
    order.status = "expired"
    await db.commit()
    raise HTTPException(502, "Payment service unavailable — please try again")
```

This is the only place where stock restoration happens synchronously in the request path. All other restoration (webhook failure, expiry) happens asynchronously.

---

### `POST /payments/verify`

**Request:**
```json
{
  "order_id": "uuid",
  "razorpay_order_id": "order_XXXXXXXXXX",
  "razorpay_payment_id": "pay_XXXXXXXXXX",
  "razorpay_signature": "hex_string"
}
```

**Verification logic (HMAC-SHA256):**
```python
import hmac, hashlib

expected = hmac.new(
    RAZORPAY_KEY_SECRET.encode(),
    f"{razorpay_order_id}|{razorpay_payment_id}".encode(),
    hashlib.sha256,
).hexdigest()

if not hmac.compare_digest(expected, razorpay_signature):
    raise HTTPException(400, "Invalid payment signature")
```

Note: `hmac.new` takes positional arguments `(key, msg, digestmod)` — keyword argument `key=` is not valid.

**Fetch the order with a row-level lock before writing:**
```python
# Inside an async with db.begin() block
result = await db.execute(
    select(Order)
    .where(Order.id == order_id, Order.buyer_id == user_id)
    .with_for_update()
)
order = result.scalar_one_or_none()
```

This prevents a simultaneous webhook and verify call from both seeing `pending_payment` and double-writing.

**Stale session guard:**

Before verifying the HMAC, check that the `razorpay_order_id` in the request matches the one currently stored on the order:

```python
if order.razorpay_order_id != request.razorpay_order_id:
    raise HTTPException(400, "Stale payment session — please retry")
```

This rejects any verify attempt using an old Razorpay order ID from before a retry call updated the field.

**Amount cross-check (after HMAC passes):**

Fetch the payment from the Razorpay API and confirm the captured amount matches what was expected:

```python
rzp_payment = razorpay_client.payment.fetch(razorpay_payment_id)
expected_paise = int(order.total_amount * 100)

if rzp_payment["amount"] != expected_paise or rzp_payment["status"] != "captured":
    raise HTTPException(400, "Payment amount mismatch or not captured")
```

This prevents a valid HMAC signature from a ₹1 test payment being replayed against a ₹1,500 order.

**On success:**
- Set `order.status = confirmed`
- Set `order.razorpay_payment_id` and `order.razorpay_signature`
- Set `order.paid_at = datetime.now(timezone.utc)`

**Response:**
```json
{ "order_id": "uuid" }
```

**Error cases:**
- `404` if order not found or doesn't belong to the current user
- `400` if order status is not `pending_payment`
- `400` if `razorpay_order_id` in request doesn't match the order's current value (stale session)
- `400` if HMAC signature verification fails
- `400` if Razorpay API confirms amount mismatch or payment not captured

---

### `POST /payments/retry/{order_id}`

Allows a buyer to retry payment for an order still in `pending_payment` status.

**Logic:**
1. Fetch order; validate it belongs to the buyer and is `pending_payment`
2. Create a new Razorpay order with the same amount
3. Overwrite `order.razorpay_order_id` with the new Razorpay order ID
4. Clear `payment_failed_at`
5. **Reset `order.expires_at = now + 30 minutes`** — this resets the expiry clock so the job won't sweep an order the user just retried
6. Return same `CheckoutSessionOut` shape as `POST /orders`

**Old Razorpay order invalidation:**

Razorpay does not provide a cancel-order API. Instead, invalidation is enforced by the stale session guard in `POST /payments/verify`: because `order.razorpay_order_id` is updated to the new value, any verify call supplying the old ID will be rejected with a 400. The old Razorpay order is harmlessly orphaned and will auto-expire on Razorpay's side.

---

### `POST /payments/webhook`

Called directly by Razorpay (not the frontend). Verifies the `X-Razorpay-Signature` header.

**Verification:**
```python
expected = hmac.new(
    RAZORPAY_WEBHOOK_SECRET.encode(),
    raw_body,
    hashlib.sha256,
).hexdigest()
```

**Payload structure:** Razorpay does not send your internal `order_id` directly. Look up the order using the Razorpay order ID from the payload:

```python
# For payment.captured / payment.failed events:
rzp_order_id = payload["payload"]["payment"]["entity"]["order_id"]
```

**Fetch the order with a row-level lock before writing** (same as `/payments/verify`):
```python
result = await db.execute(
    select(Order)
    .where(Order.razorpay_order_id == rzp_order_id)
    .with_for_update()
)
order = result.scalar_one_or_none()
```

The `UNIQUE` constraint on `razorpay_order_id` ensures PostgreSQL uses the index for this lookup. If the ID has been rotated by a retry call, the old Razorpay order ID won't match any row — the handler returns 200 and does nothing.

**Handled events:**

| Event              | Condition                      | Action                                                            |
|--------------------|--------------------------------|-------------------------------------------------------------------|
| `payment.captured` | `status == pending_payment`    | Set `confirmed`, store `razorpay_payment_id`, set `paid_at`       |
| `payment.failed`   | `status == pending_payment`    | Set `payment_failed_at = now()` — **do not change status**        |
| anything else      | any                            | Ignore — return 200                                               |

`payment.failed` sets `payment_failed_at` but leaves the order in `pending_payment` so the user can still retry within the 30-minute window. The expiry job handles the final `expired` transition for both timed-out and failed-then-abandoned orders. Do **not** restore stock here — stock is only restored when the order leaves `pending_payment` permanently (via expiry job).

Both this handler and `POST /payments/verify` must be idempotent — if `order.status != pending_payment` when the lock is acquired, skip all writes and return 200 immediately. The `SELECT FOR UPDATE` ensures only one of the two concurrent writers proceeds; the second sees the already-updated status and exits cleanly.

**Response:** Always `200 OK` with `{}` body (Razorpay retries on non-2xx).

---

### Order Expiry Background Job

`pending_payment` orders that are never completed (user closed the browser, network drop, etc.) would lock stock indefinitely. A background job runs every 5 minutes and expires stale orders.

**Tool:** APScheduler (`apscheduler` — already a common FastAPI pairing, no separate worker process needed).

**Logic (runs every 5 minutes):**

An order is eligible for expiry when `expires_at < now` and `status == pending_payment`. `expires_at` is the single source of truth for the expiry clock — it is set at order creation and **reset on every retry call**, so a user who retried 2 minutes ago always has a fresh 30-minute window regardless of when the original order was created.

```python
async def expire_pending_orders(db: AsyncSession):
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(Order)
        .where(
            Order.status == "pending_payment",
            Order.expires_at < now,
        )
        .with_for_update(skip_locked=True)   # skip rows locked by verify/webhook
    )
    orders = result.scalars().all()
    for order in orders:
        for item in order.items:
            await db.execute(
                update(Product)
                .where(Product.id == item.product_id)
                .values(stock=Product.stock + item.quantity)
            )
        order.status = "expired"
    await db.commit()
```

`skip_locked=True` means the job skips any order row currently held by a verify or webhook transaction — those in-flight payments are handled by their own path and don't need expiry.

**New status:** Add `expired` to the status enum alongside `pending_payment` and `confirmed`. `cancelled` is no longer used.

**Startup wiring (`main.py`):**
```python
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()
scheduler.add_job(expire_pending_orders_task, "interval", minutes=5)

@app.on_event("startup")
async def start_scheduler():
    scheduler.start()

@app.on_event("shutdown")
async def stop_scheduler():
    scheduler.shutdown()
```

**`expire_pending_orders_task`** wraps `expire_pending_orders` by creating a fresh DB session from the async session factory (cannot use the request-scoped `get_db` dependency here).

---

### Schemas

**`CheckoutSessionOut`**
```python
class CheckoutSessionOut(BaseModel):
    order_id: UUID
    razorpay_order_id: str
    amount: int          # paise
    currency: str
    key_id: str
    name: str            # merchant display name shown in Razorpay modal
    description: str     # payment description shown in Razorpay modal
```

`name` and `description` are populated by the backend (e.g. `"Vendora"` and `"Order #<short_id>"`). The frontend passes them directly to the Razorpay modal options without hardcoding any strings — branding changes require a backend deploy only.

**`VerifyPaymentRequest`**
```python
class VerifyPaymentRequest(BaseModel):
    order_id: UUID
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
```

**`VerifyPaymentOut`**
```python
class VerifyPaymentOut(BaseModel):
    order_id: UUID
```

---

### File Structure

**Backend:**
```
models/order.py            — add 5 new columns (razorpay_order_id, razorpay_payment_id,
                             razorpay_signature, payment_failed_at, paid_at) + status default
schemas/payment.py         — CheckoutSessionOut, VerifyPaymentRequest, VerifyPaymentOut
services/payment.py        — create_razorpay_order, verify_payment, handle_webhook,
                             expire_pending_orders
routers/payment.py         — /payments/verify, /payments/retry/{id}, /payments/webhook
routers/order.py           — modify POST /orders to call payment service
jobs/order_expiry.py       — APScheduler job wiring + session factory helper
main.py                    — register scheduler on startup/shutdown
alembic/versions/          — migration adding payment columns + explicit index
```

**Frontend:**
```
src/app/checkout/page.tsx              — "Pay Now" button + Razorpay modal
src/app/checkout/retry/[order_id]/     — retry checkout page
src/app/orders/page.tsx                — "Complete Payment" link on pending_payment rows
src/actions/payment-actions.ts         — verifyPayment, retryPayment server actions
```

---

## Frontend

### Changes to Checkout Page (`/checkout`)

1. Load Razorpay checkout script dynamically (via `useEffect`):
   ```html
   <script src="https://checkout.razorpay.com/v1/checkout.js" />
   ```

2. "Place Order" button becomes "Pay Now"

3. On click:
   - Call `POST /orders` (server action) → receive `CheckoutSessionOut`
   - Open Razorpay modal with options:
     ```ts
     {
       key: session.key_id,
       order_id: session.razorpay_order_id,
       amount: session.amount,
       currency: session.currency,
       name: session.name,
       description: session.description,
       handler: async (response) => {
         await verifyPayment({ order_id, ...response })
         router.push(`/orders/${order_id}`)
       },
       modal: { ondismiss: () => setPaymentDismissed(true) }
     }
     ```

4. On modal dismiss: show a "Retry Payment" button that calls `POST /payments/retry/{order_id}` and re-opens the modal.

### New Server Actions (`src/actions/payment-actions.ts`)

```ts
verifyPayment(data: VerifyPaymentRequest): Promise<{ order_id: string }>
retryPayment(order_id: string): Promise<CheckoutSession>
```

### Order Confirmation Page (`/orders/{id}`)

No changes needed — already renders order details. The `confirmed` status badge will display correctly.

### Order History Page (`/orders`)

Rows with `pending_payment` status show a "Complete Payment" link that navigates to `/checkout/retry/[order_id]`.

### Retry Checkout Page (`/checkout/retry/[order_id]`)

A dedicated page that:
1. Fetches the order details (to show the order summary to the user)
2. On mount, calls `POST /payments/retry/{order_id}` to get a fresh `CheckoutSessionOut`
3. Opens the Razorpay modal immediately — same handler as the normal checkout page
4. On success → redirect to `/orders/{order_id}`
5. On dismiss → stay on page with a "Try Again" button that re-calls retry and re-opens the modal
6. If the order is `expired` when the page loads → show "This payment link has expired" with a "Return to cart" CTA

---

## Error Handling

| Scenario                            | Backend response        | Frontend action                           | Stock effect                         |
|-------------------------------------|-------------------------|-------------------------------------------|--------------------------------------|
| Cart empty                          | 400                     | Toast + redirect to cart                  | none                                 |
| Stock insufficient                  | 400 with product name   | Toast with product name                   | none                                 |
| Razorpay API unreachable            | 502                     | Toast "Payment service unavailable"       | restored in catch block (see POST /orders) |
| Stale session on verify             | 400                     | Toast "Session expired — retry"           | stock stays reserved                 |
| Signature mismatch                  | 400                     | Toast "Payment verification failed"       | stock stays reserved                 |
| Amount mismatch (Razorpay API)      | 400                     | Toast "Payment verification failed"       | stock stays reserved                 |
| Payment failed (webhook)            | —                       | "Complete Payment" shows on orders page   | stays reserved (user can retry)      |
| Order expired (30 min job)          | —                       | "Complete Payment" link gone              | restored by expiry job               |
| Order already confirmed             | 400                     | Toast + redirect to order page            | no change                            |
| Modal dismissed                     | (no request made)       | Show "Retry Payment" button               | stock stays reserved                 |

---

## Security Notes

- `RAZORPAY_KEY_SECRET` and `RAZORPAY_WEBHOOK_SECRET` are never sent to the frontend
- Only `RAZORPAY_KEY_ID` (public) is included in the checkout session response
- All payment verification uses `hmac.compare_digest` to prevent timing attacks
- Webhook endpoint does not require JWT auth — it authenticates via Razorpay's HMAC header
- `/payments/verify` and `/payments/retry` require JWT auth and validate order ownership

---

## Out of Scope

- Refunds (future feature)
- COD (cash on delivery) option
- Saved cards / payment methods
- Order cancellation by buyer
- Order status tracking post-confirmation (shipping, delivery — Feature 8)
- Admin order management view
