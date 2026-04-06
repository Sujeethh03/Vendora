# Shopping Cart — Design Document

## Overview

A server-side, database-backed shopping cart linked to authenticated users.
Cart state persists across devices and browser sessions.
Guest users are redirected to login before they can add items.

---

## Database

### Table: `cart_items`

| Column       | Type      | Constraints                              |
|--------------|-----------|------------------------------------------|
| `id`         | UUID (PK) | auto-generated                           |
| `user_id`    | UUID (FK) | → `users.id` ON DELETE CASCADE           |
| `product_id` | UUID (FK) | → `products.id` ON DELETE CASCADE        |
| `quantity`   | Integer   | NOT NULL, >= 1                           |
| `created_at` | Timestamp | timezone-aware                           |
| `updated_at` | Timestamp | timezone-aware, auto-updated             |

**Unique constraint:** `(user_id, product_id)` — one row per product per user.
Adding the same product again increments quantity instead of creating a new row.

---

## Backend

### API Endpoints

All endpoints require authentication (`get_current_user`).

| Method   | Path                          | Description                          |
|----------|-------------------------------|--------------------------------------|
| `GET`    | `/cart`                       | Get current user's cart with totals  |
| `POST`   | `/cart/items`                 | Add item or increment quantity       |
| `PUT`    | `/cart/items/{product_id}`    | Set quantity for a specific item     |
| `DELETE` | `/cart/items/{product_id}`    | Remove a specific item               |
| `DELETE` | `/cart`                       | Clear entire cart                    |

### Schemas

**Request — Add Item:**
```json
{
  "product_id": "uuid",
  "quantity": 1
}
```

**Request — Update Quantity:**
```json
{
  "quantity": 3
}
```

**Response — Cart:**
```json
{
  "items": [
    {
      "product_id": "uuid",
      "product_name": "string",
      "product_image": "string | null",
      "price": 499.00,
      "quantity": 2,
      "subtotal": 998.00
    }
  ],
  "total_items": 2,
  "total_amount": 998.00
}
```

### Business Rules

- **Stock check on add/update:** quantity cannot exceed available `product.stock`
- **Product availability:** cannot add a deleted or out-of-stock product
- **Add duplicate:** if item already exists in cart, increment quantity (do not duplicate row)
- **Quantity floor:** quantity must be >= 1; setting quantity to 0 removes the item
- **Price:** always reflects current product price — not locked at time of adding

### File Structure

```
services/cart.py       — business logic
routers/cart.py        — route handlers
schemas/cart.py        — request/response models
models/cart.py         — CartItem SQLAlchemy model
alembic/versions/      — migration for cart_items table
```

---

## Frontend

### State Management

A `CartProvider` (client component, placed in root layout alongside `AuthProvider`) holds cart state globally and exposes:

```ts
interface CartContextType {
    items: CartItem[]
    totalItems: number
    totalAmount: number
    isLoading: boolean
    addItem: (productId: string, quantity: number) => Promise<void>
    removeItem: (productId: string) => Promise<void>
    updateQuantity: (productId: string, quantity: number) => Promise<void>
    clearCart: () => Promise<void>
}
```

Cart is fetched from the server on mount (if user is logged in) and kept in sync after every mutation.

### Server Actions

```
src/actions/cart-actions.ts
  getCart()
  addToCart(productId, quantity)
  updateCartItem(productId, quantity)
  removeFromCart(productId)
  clearCart()
```

### UI Components

| Component | Location | Description |
|-----------|----------|-------------|
| Cart icon + badge | `Navbar` | Shows total item count, links to cart page |
| Add to Cart button | `ProductCard`, `ProductDetailPage` | Adds item, shows loading state, redirects to login if guest |
| Quantity stepper | Cart page | +/- buttons to update quantity inline |
| Cart page | `/cart` | Full cart view with items, quantities, subtotal, checkout CTA |

### Routes

| Path | Description |
|------|-------------|
| `/cart` | Cart page — list of items, order summary, proceed to checkout |

### Guest Handling

- If an unauthenticated user clicks "Add to Cart", redirect to `/login?redirect=/products/{id}`
- After login, redirect back to the product page (not the cart) so user can confirm and add

### Cart Page Layout

```
┌─────────────────────────────────────────────┐
│  Your Cart (3 items)                        │
├─────────────────┬───────────────────────────┤
│                 │                           │
│  Cart Items     │   Order Summary           │
│  ─────────────  │   ─────────────           │
│  [img] Name     │   Subtotal     ₹1,497     │
│        ₹499 x 2 │   Shipping     Free       │
│        [- 2 +]  │   ─────────────           │
│        [Remove] │   Total        ₹1,497     │
│                 │                           │
│  [img] Name     │   [Proceed to Checkout]   │
│        ...      │                           │
│                 │                           │
└─────────────────┴───────────────────────────┘
```

---

## Alembic Migration

One migration adding the `cart_items` table with:
- UUID primary key
- Foreign keys to `users` and `products` with CASCADE delete
- Unique constraint on `(user_id, product_id)`
- Timestamps

---

## Out of Scope (for this feature)

- Guest/anonymous cart (no localStorage fallback)
- Cart merging on login
- Saved-for-later / wishlist
- Price locking at cart time (handled at checkout)
- Coupon/discount application (handled at checkout)
