# Vendora — Backend

FastAPI + PostgreSQL backend for the Vendora marketplace. Handles auth, product listings, orders, payments (Razorpay), and image uploads (Cloudinary).

---

## Tech Stack

| Layer | Tool |
|---|---|
| Framework | FastAPI (async) |
| Database | PostgreSQL |
| ORM | SQLAlchemy 2.0 async + Alembic |
| Auth | JWT (python-jose) + httpOnly cookie refresh tokens |
| Image Storage | Cloudinary |
| Payments | Razorpay |
| Config | pydantic-settings |
| Deploy | Railway |

---

## Project Structure

```
vendora-backend/
├── main.py               # App entry point, routers + middleware registered here
├── config.py             # Typed settings loaded from .env
├── database.py           # Async SQLAlchemy engine + session factory
├── dependencies.py       # Auth guards (get_current_user, require_seller, require_admin)
├── exceptions.py         # Custom exception classes + global handlers
│
├── models/
│   ├── user.py           # User, RefreshToken, SellerProfile
│   ├── product.py        # Product, ProductImage
│   └── order.py          # Order, OrderItem, Payment
│
├── schemas/
│   ├── user.py           # RegisterRequest, LoginRequest, UserOut
│   ├── product.py        # ProductCreate, ProductUpdate, ProductOut
│   └── order.py          # OrderCreate, OrderOut, PaymentVerifyRequest
│
├── routers/
│   ├── auth.py           # /auth — register, login, refresh, logout, me
│   ├── products.py       # /products — CRUD + image upload
│   ├── orders.py         # /orders — place order, order history
│   ├── sellers.py        # /seller — seller order management
│   ├── payments.py       # /payments — Razorpay create + verify
│   └── admin.py          # /admin — approve sellers and products
│
├── services/
│   ├── auth.py           # register, login, token refresh, logout logic
│   ├── product.py        # product CRUD + image management
│   ├── order.py          # place order, order history, status updates
│   └── payment.py        # Razorpay order creation + signature verification
│
├── utils/
│   └── cloudinary.py     # Image upload helper
│
├── postman/
│   ├── collections/      # 4 Postman collections (Auth, Products, Orders, Admin)
│   └── environments/     # Local and Dev environments
│
├── alembic/              # Database migrations
├── alembic.ini
├── requirements.txt
└── .env.example
```

---

## Local Setup

### 1. Clone and install dependencies

```bash
cd vendora-backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure environment variables

```bash
cp .env.example .env
```

Fill in `.env`:

```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/vendora
SYNC_DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/vendora

SECRET_KEY=your-secret-key-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

### 3. Run database migrations

```bash
alembic revision --autogenerate -m "init"
alembic upgrade head
```

> Alembic uses `SYNC_DATABASE_URL` (psycopg2). The app runtime uses `DATABASE_URL` (asyncpg).

### 4. Start the server

```bash
uvicorn main:app --reload
```

API is live at `http://localhost:8000`
Interactive docs at `http://localhost:8000/docs`

---

## API Overview

### Auth — `/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register as buyer or seller |
| POST | `/auth/login` | — | Login, sets httpOnly cookies |
| POST | `/auth/refresh` | Cookie | Rotate refresh token |
| POST | `/auth/logout` | Cookie | Revoke token, clear cookies |
| GET | `/auth/me` | Cookie | Get current user |

### Products — `/products`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/products` | — | List approved products (filter + paginate) |
| GET | `/products/{id}` | — | Get single product |
| POST | `/products` | Seller | Create product |
| PUT | `/products/{id}` | Seller | Update own product |
| DELETE | `/products/{id}` | Seller | Soft-delete own product |
| POST | `/products/{id}/images` | Seller | Upload image to Cloudinary |

### Orders — `/orders`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/orders` | Buyer | Place an order |
| GET | `/orders/my` | Buyer | Own order history |

### Seller — `/seller`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/seller/orders` | Seller | Orders containing your products |
| PUT | `/seller/orders/{id}` | Seller | Update status (shipped/delivered) |

### Payments — `/payments`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments/create-order` | Buyer | Create Razorpay order |
| POST | `/payments/verify` | Buyer | Verify signature, confirm order |

### Admin — `/admin`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/admin/sellers` | Admin | List all seller profiles |
| POST | `/admin/sellers/{id}/approve` | Admin | Approve a seller |
| POST | `/admin/products/{id}/approve` | Admin | Approve a product |
| POST | `/admin/products/{id}/reject` | Admin | Reject a product |

---

## Auth Flow

1. User logs in → receives `access_token` (15 min) + `refresh_token` (7 days) as httpOnly cookies
2. Every request reads the cookie server-side — never exposed to client JS
3. When access token expires, call `POST /auth/refresh` to rotate tokens silently
4. On logout, refresh token is revoked in DB and both cookies are cleared

---

## Razorpay Payment Flow

```
1. Buyer clicks "Pay Now"
2. POST /payments/create-order → returns { razorpay_order_id, amount, currency }
3. Frontend opens Razorpay widget with those values
4. Buyer pays → Razorpay returns { payment_id, order_id, signature }
5. POST /payments/verify → FastAPI verifies HMAC signature server-side
6. Valid → order confirmed, payment marked as paid
   Invalid → 400 error, order not confirmed
```

---

## Postman Testing

Import from `postman/`:

1. **Environments** — import `Local.postman_environment.json`, select it
2. **Collections** — import all 4 collections in order:
   - `1_Vendora_Auth_API` — start here, login sets cookies automatically
   - `2_Vendora_Products_API`
   - `3_Vendora_Orders_and_Payments_API`
   - `4_Vendora_Admin_API`

Test scripts auto-capture `product_id`, `order_id`, `seller_profile_id` etc. into environment variables.

---

## Database Schema

| Table | Purpose |
|---|---|
| `users` | Buyers, sellers, admins. Soft delete via `deleted_at` |
| `refresh_tokens` | Stored as SHA-256 hash, not raw token |
| `seller_profiles` | Created on seller registration, approved by admin |
| `products` | Linked to seller. Status: `pending` → `approved` / `rejected` |
| `product_images` | Cloudinary URLs, first image is primary |
| `orders` | Placed by buyers. Status: `pending` → `confirmed` → `shipped` → `delivered` |
| `order_items` | Line items per order with unit price snapshot |
| `payments` | Razorpay order/payment IDs + signature. Status: `created` → `paid` / `failed` |

---

## Admin Setup

After first deploy, set your account as admin directly in the database:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

No admin signup page — intentional for v1.

---

## Deployment (Railway)

1. Push code to GitHub
2. Create a new Railway project, add a PostgreSQL plugin
3. Deploy the FastAPI service, set the root to `vendora-backend/`
4. Add all environment variables from `.env.example` in Railway settings
5. Railway auto-detects and runs `uvicorn main:app`
