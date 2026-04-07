# Checkout & Orders — Design Document

## Overview

Buyer places an order from their cart by providing a delivery address.
Order items snapshot the product name and price at the time of purchase so historical records remain accurate even if products are later edited or deleted.
Stock is decremented and the cart is cleared on successful order placement.
Payments (Razorpay) are wired in as Feature 3 — this feature creates orders with status `confirmed` (COD-style) as a placeholder until then.

---

## Database

### Table: `orders`

| Column             | Type          | Constraints                              |
|--------------------|---------------|------------------------------------------|
| `id`               | UUID (PK)     | auto-generated                           |
| `buyer_id`         | UUID (FK)     | → `users.id` ON DELETE CASCADE           |
| `status`           | VARCHAR(20)   | NOT NULL, default `confirmed`            |
| `delivery_address` | JSONB         | NOT NULL — snapshot of address at order  |
| `total_amount`     | Numeric(14,2) | NOT NULL                                 |
| `created_at`       | Timestamp     | timezone-aware                           |
| `updated_at`       | Timestamp     | timezone-aware, auto-updated             |

**Order statuses:** `confirmed` → `cancelled`
_(`processing`, `shipped`, `delivered` added in Feature 8 — Order Tracking)_

**`delivery_address` shape (JSON):**
```json
{
  "full_name": "string",
  "phone": "string",
  "line1": "string",
  "line2": "string | null",
  "city": "string",
  "state": "string",
  "pincode": "string"
}
```

---

### Table: `order_items`

| Column         | Type          | Constraints                                 |
|----------------|---------------|---------------------------------------------|
| `id`           | UUID (PK)     | auto-generated                              |
| `order_id`     | UUID (FK)     | → `orders.id` ON DELETE CASCADE             |
| `product_id`   | UUID (FK)     | → `products.id` ON DELETE SET NULL, nullable|
| `product_name` | Text          | NOT NULL — snapshot at time of order        |
| `unit_price`   | Numeric(14,2) | NOT NULL — snapshot at time of order        |
| `quantity`     | Integer       | NOT NULL, >= 1                              |
| `subtotal`     | Numeric(14,2) | NOT NULL — unit_price × quantity            |

`product_id` is nullable so order history survives product deletion.
`product_name` and `unit_price` are always set from the product at order time.

---

## Backend

### API Endpoints

All endpoints require authentication (`get_current_user`).

| Method   | Path               | Description                                     |
|----------|--------------------|------------------------------------------------ |
| `POST`   | `/orders`          | Place order from cart                           |
| `GET`    | `/orders`          | List current buyer's orders (newest first)      |
| `GET`    | `/orders/{id}`     | Get single order with items                     |

### Schemas

**Request — Place Order:**
```json
{
  "delivery_address": {
    "full_name": "Sujeeth Kumar",
    "phone": "9876543210",
    "line1": "42 MG Road",
    "line2": "Apt 3B",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
  }
}
```

**Response — Order:**
```json
{
  "id": "uuid",
  "status": "confirmed",
  "total_amount": 1497.00,
  "delivery_address": { ... },
  "created_at": "2026-04-07T10:00:00Z",
  "items": [
    {
      "product_id": "uuid | null",
      "product_name": "string",
      "unit_price": 499.00,
      "quantity": 3,
      "subtotal": 1497.00
    }
  ]
}
```

**Response — Order List:**
```json
{
  "items": [ { ...order without items... } ],
  "total": 5,
  "page": 1,
  "page_size": 10
}
```

### Business Rules

- **Cart must not be empty** — 400 if cart has no items
- **Stock validation** — for each cart item, check `quantity <= product.stock`; if any item fails, return 400 with the product name
- **Price & name snapshot** — copy `product.price` and `product.name` into `order_items` at placement time
- **Stock decrement** — reduce `product.stock` by ordered quantity for each item
- **Cart clearing** — delete all cart items for the buyer after order is created
- **Total amount** — sum of all `order_item.subtotal` values

### File Structure

```
models/order.py        — Order, OrderItem SQLAlchemy models
schemas/order.py       — request/response Pydantic models
services/order.py      — business logic (place, list, get)
routers/order.py       — route handlers
alembic/versions/      — migration for orders + order_items tables
```

---

## Frontend

### Pages

| Path              | Description                                              |
|-------------------|----------------------------------------------------------|
| `/checkout`       | Delivery address form + order summary, "Place Order" CTA |
| `/orders`         | Buyer's order history list                               |
| `/orders/{id}`    | Order detail — confirmation screen and item breakdown    |

### Server Actions

```
src/actions/order-actions.ts
  placeOrder(deliveryAddress)     — POST /orders, clears cart context
  getOrders(page?)                — GET /orders
  getOrder(id)                    — GET /orders/{id}
```

### Checkout Page Flow

```
Cart page
  └── "Proceed to Checkout" button
        └── /checkout
              ├── Left: Delivery Address Form
              │     full_name, phone, line1, line2, city, state, pincode
              └── Right: Order Summary (read-only, from CartProvider)
                    item list, subtotal, shipping (Free), total
                    [Place Order] button
                          └── POST /orders
                                ├── success → redirect to /orders/{id} (confirmation)
                                └── error   → toast with message
```

### Order Confirmation Page (`/orders/{id}`)

```
┌──────────────────────────────────────────┐
│  ✓ Order Placed Successfully             │
│  Order #abc123  •  7 Apr 2026            │
├──────────────────────────────────────────┤
│  Items                                   │
│  Product Name       ₹499 × 3   ₹1,497   │
│  ─────────────────────────────────────   │
│  Total                          ₹1,497   │
├──────────────────────────────────────────┤
│  Delivering to                           │
│  Sujeeth Kumar, 9876543210               │
│  42 MG Road, Apt 3B                      │
│  Bengaluru, Karnataka 560001             │
├──────────────────────────────────────────┤
│  [View All Orders]   [Continue Shopping] │
└──────────────────────────────────────────┘
```

### Order History Page (`/orders`)

- Lists orders newest first with pagination (10/page)
- Each row: order date, status badge, item count, total amount, "View" link
- Empty state: "No orders yet" + "Browse Products" CTA

### Checkout Form Validation (Zod)

```ts
const addressSchema = z.object({
  full_name: z.string().min(2),
  phone:     z.string().regex(/^\d{10}$/),
  line1:     z.string().min(5),
  line2:     z.string().optional(),
  city:      z.string().min(2),
  state:     z.string().min(2),
  pincode:   z.string().regex(/^\d{6}$/),
})
```

---

## Alembic Migration

One migration adding both `orders` and `order_items` tables:
- `orders`: UUID PK, FK to users (CASCADE), JSONB address, status, total, timestamps
- `order_items`: UUID PK, FK to orders (CASCADE), FK to products (SET NULL), name+price snapshots, quantity, subtotal

---

## Integration with Feature 3 (Payments)

When Razorpay is added:
- Order is created with status `pending_payment` instead of `confirmed`
- A Razorpay order is created and the payment UI is shown
- On payment success webhook → order status updated to `confirmed`
- On payment failure → order status set to `cancelled`, stock restored

This feature intentionally keeps that hook point clean — the `status` field and `POST /orders` response are designed to accommodate it without breaking changes.

---

## Out of Scope (for this feature)

- Payment collection (Feature 3)
- Order cancellation by buyer
- Order status updates / tracking (Feature 8)
- Admin order management view
- Invoice / receipt generation
- Address book (saved addresses)
