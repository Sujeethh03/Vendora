# Vendora Backend — API Reference & Database Schema

## Overview

**Framework:** FastAPI (Python) + PostgreSQL + SQLAlchemy 2.0 (async)

**Base URL:** `http://localhost:8000`

**Authentication:** JWT access tokens + refresh token rotation, delivered as httpOnly cookies.

---

## Database Tables

### `users`

Stores all registered users (buyers, sellers, admins).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | Auto-generated |
| `email` | TEXT | UNIQUE, NOT NULL | |
| `password_hash` | TEXT | NOT NULL | bcrypt hashed |
| `role` | VARCHAR(20) | DEFAULT `'buyer'` | `buyer`, `seller`, `admin` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | Auto-updates | |
| `deleted_at` | TIMESTAMPTZ | Nullable | NULL = active (soft delete) |

**Relationships:** One-to-many with `refresh_tokens` (cascade delete), one-to-many with `products`.

---

### `refresh_tokens`

Tracks issued refresh tokens for session management. Only the SHA-256 hash of the raw token is stored.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `user_id` | UUID | FK → `users.id` | CASCADE DELETE |
| `token_hash` | TEXT | UNIQUE, NOT NULL | SHA-256 of raw token |
| `expires_at` | TIMESTAMPTZ | NOT NULL | 7 days from creation |
| `revoked_at` | TIMESTAMPTZ | Nullable | NULL = valid; set on logout or rotation |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |

---

### `products`

Stores product listings created by sellers.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `seller_id` | UUID | FK → `users.id` | |
| `name` | TEXT | NOT NULL | |
| `description` | TEXT | Nullable | |
| `price` | NUMERIC(14,2) | NOT NULL | |
| `stock` | INTEGER | NOT NULL, DEFAULT 0 | |
| `category` | TEXT | Nullable | |
| `status` | VARCHAR(20) | DEFAULT `'approved'` | `pending`, `approved`, `rejected` |
| `created_at` | TIMESTAMPTZ | DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | Auto-updates | |
| `deleted_at` | TIMESTAMPTZ | Nullable | NULL = active (soft delete) |

**Relationships:** Many-to-one with `users` (seller), one-to-many with `product_images` (cascade delete).

---

### `product_images`

Stores image references for products (up to 5 per product).

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | UUID | PK | |
| `product_id` | UUID | FK → `products.id` | CASCADE DELETE |
| `url` | TEXT | NOT NULL | Local path served at `/static/products/` |
| `is_primary` | BOOLEAN | DEFAULT `false` | Only one image is primary per product |

---

## API Endpoints

### Health Check

#### `GET /health`

Returns service status.

- **Auth:** None
- **Response `200`:**
  ```json
  { "status": "ok" }
  ```

---

### Authentication — `/auth`

#### `POST /auth/register`

Creates a new user account with the default role of `buyer`.

- **Auth:** None
- **Request body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response `201`:**
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-03-26T12:00:00Z"
  }
  ```
- **Errors:** `409 Conflict` if email is already registered.

---

#### `POST /auth/login`

Authenticates a user and issues access + refresh tokens as httpOnly cookies.

- **Auth:** None
- **Request body:**
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response `200`:**
  ```json
  {
    "access_token": "<jwt>",
    "refresh_token": "<raw_token>",
    "token_type": "bearer",
    "expires_in": 900
  }
  ```
- **Cookies set:**
  - `access_token` — httpOnly, max_age=900s (15 min)
  - `refresh_token` — httpOnly, max_age=604800s (7 days)
- **Errors:** `401 Unauthorized` if credentials are invalid.

---

#### `POST /auth/refresh`

Rotates the refresh token — revokes the old one and issues a new access + refresh token pair.

- **Auth:** Reads `refresh_token` from cookie
- **Response `200`:**
  ```json
  { "message": "Tokens refreshed" }
  ```
- **Cookies set:** New `access_token` and `refresh_token` cookies replace the old ones.
- **Errors:** `401 Unauthorized` if the token is invalid, expired, or already revoked.

---

#### `POST /auth/logout`

Revokes the user's refresh token and clears both auth cookies.

- **Auth:** Optional (refresh token from cookie is revoked if present)
- **Response `200`:**
  ```json
  { "message": "Logged out" }
  ```
- **Cookies deleted:** `access_token`, `refresh_token`

---

#### `GET /auth/me`

Returns the currently authenticated user's profile.

- **Auth:** Required (JWT access token in cookie)
- **Response `200`:**
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "created_at": "2026-03-26T12:00:00Z"
  }
  ```
- **Errors:** `401 Unauthorized` if the token is missing or invalid.

---

### Products — `/products`

#### `GET /products`

Returns a paginated list of active (non-deleted) products with optional filtering.

- **Auth:** None
- **Query parameters:**

  | Parameter | Type | Default | Description |
  |-----------|------|---------|-------------|
  | `category` | string | — | Filter by category (exact match) |
  | `search` | string | — | Case-insensitive search on product name |
  | `min_price` | float | — | Minimum price (inclusive) |
  | `max_price` | float | — | Maximum price (inclusive) |
  | `seller_id` | UUID | — | Filter products by a specific seller |
  | `page` | int | `1` | Page number (1-indexed) |
  | `page_size` | int | `20` | Results per page (max 100) |

- **Response `200`:**
  ```json
  {
    "items": [
      {
        "id": "uuid",
        "seller_id": "uuid",
        "name": "Laptop",
        "description": "High-performance laptop",
        "price": 999.99,
        "stock": 25,
        "category": "electronics",
        "status": "approved",
        "created_at": "2026-03-26T12:00:00Z",
        "images": [
          {
            "id": "uuid",
            "url": "/static/products/filename.jpg",
            "is_primary": true
          }
        ]
      }
    ],
    "total": 125,
    "page": 1,
    "page_size": 20
  }
  ```

---

#### `GET /products/{product_id}`

Returns a single product by ID.

- **Auth:** None
- **Path parameter:** `product_id` (UUID)
- **Response `200`:** Single product object (same shape as items in the list response)
- **Errors:** `404 Not Found` if the product doesn't exist or has been deleted.

---

#### `POST /products`

Creates a new product listing. The authenticated user becomes the seller.

- **Auth:** Required
- **Request body:**
  ```json
  {
    "name": "Laptop",
    "description": "High-performance laptop",
    "price": 999.99,
    "stock": 25,
    "category": "electronics"
  }
  ```
- **Response `201`:** Created product object with `images: []`.

---

#### `PUT /products/{product_id}`

Updates an existing product. Only the seller who owns the product can update it.

- **Auth:** Required
- **Path parameter:** `product_id` (UUID)
- **Request body:** All fields are optional:
  ```json
  {
    "name": "Laptop Pro",
    "price": 1099.99,
    "stock": 30
  }
  ```
- **Response `200`:** Updated product object.
- **Errors:** `403 Forbidden` if not the product owner, `404 Not Found` if product doesn't exist.

---

#### `DELETE /products/{product_id}`

Soft-deletes a product (sets `deleted_at`). Also deletes associated image files from disk.

- **Auth:** Required
- **Path parameter:** `product_id` (UUID)
- **Response `204`:** No content.
- **Errors:** `403 Forbidden` if not the product owner.

---

#### `POST /products/{product_id}/images`

Uploads an image for a product. The first uploaded image is automatically set as primary.

- **Auth:** Required (must be product owner)
- **Path parameter:** `product_id` (UUID)
- **Request:** `multipart/form-data` with a `file` field (JPEG, PNG, or WebP)
- **Constraints:**
  - Max 5 images per product
  - Allowed types: `image/jpeg`, `image/png`, `image/webp`
  - Files stored locally at `uploads/products/` and served at `/static/products/`
- **Response `201`:**
  ```json
  {
    "id": "uuid",
    "url": "/static/products/filename.jpg",
    "is_primary": true
  }
  ```
- **Errors:** `403 Forbidden` if not the product owner, `400 Bad Request` if invalid file type or max image count exceeded.

---

#### `DELETE /products/{product_id}/images/{image_id}`

Deletes a product image. If the deleted image was primary, the next available image is promoted to primary.

- **Auth:** Required (must be product owner)
- **Path parameters:** `product_id`, `image_id` (UUIDs)
- **Response `204`:** No content.
- **Errors:** `403 Forbidden` if not the product owner, `404 Not Found` if image doesn't exist.

---

#### `PATCH /products/{product_id}/images/{image_id}/primary`

Sets the specified image as the primary image for the product.

- **Auth:** Required (must be product owner)
- **Path parameters:** `product_id`, `image_id` (UUIDs)
- **Response `200`:**
  ```json
  {
    "id": "uuid",
    "url": "/static/products/filename.jpg",
    "is_primary": true
  }
  ```
- **Errors:** `403 Forbidden` if not the product owner, `404 Not Found` if image doesn't exist.

---

## Authentication Flow

1. User calls `POST /auth/login` → server sets `access_token` (15 min) and `refresh_token` (7 days) as httpOnly cookies.
2. Subsequent requests automatically include the cookies; server verifies the access token via the `get_current_user` dependency.
3. When the access token expires, the client calls `POST /auth/refresh` → server validates the refresh token hash in the DB, revokes it, and issues a new pair.
4. On logout, the client calls `POST /auth/logout` → server revokes the refresh token and clears both cookies.

**JWT payload:**
```json
{
  "sub": "<user_uuid>",
  "role": "buyer | seller | admin",
  "exp": "<unix_timestamp>"
}
```

---

## Error Responses

All errors return a JSON body with a `detail` field:

```json
{ "detail": "Error message here" }
```

| Status | Exception | Common Causes |
|--------|-----------|---------------|
| `400` | Bad Request | Invalid file type, max images exceeded |
| `401` | Unauthorized | Missing/invalid/expired token |
| `403` | Forbidden | Not the resource owner |
| `404` | Not Found | Resource doesn't exist or was deleted |
| `409` | Conflict | Email already registered |

---

## Static Files

Product images are served from:

```
GET /static/products/{filename}
```

Files are stored on disk at `uploads/products/` relative to the backend root.

---

## Planned (Not Yet Implemented)

The following features are designed but not yet built:

- **Orders** (`/orders`) — order creation, buyer order history, status tracking
- **Seller Orders** (`/seller/orders`) — seller view of orders for their products
- **Payments** (`/payments`) — Razorpay integration (create order, verify webhook)
- **Admin Panel** (`/admin`) — seller and product approval management
- **Seller Profiles** — shop details, approval status
