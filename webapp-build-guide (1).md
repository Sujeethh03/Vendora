# Vendora — V1 Build Guide
### Stack: FastAPI + Next.js

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | File-based routing, server components, server actions |
| Backend | FastAPI (Python) | Lightweight REST API, async-first, auto docs |
| Database | PostgreSQL | Free tier via Railway or Supabase |
| ORM | SQLAlchemy 2.0 (async) + Alembic | Async DB queries + migrations |
| DB Driver | asyncpg | Async PostgreSQL driver (use psycopg2-binary only for Alembic) |
| Config | pydantic-settings | Type-safe environment variable loading |
| Validation (BE) | Pydantic v2 | Request/response schemas |
| Validation (FE) | Zod + React Hook Form | Type-safe form validation on the frontend |
| Auth | JWT (python-jose) + refresh tokens | Access token (15min) + refresh token (7d) rotation |
| UI Components | shadcn/ui + Radix UI | Accessible, composable component primitives |
| Styling | Tailwind CSS | Utility-first, fast to build |
| Theming | next-themes | Dark/light mode toggle, stored in localStorage |
| Toasts | sonner | Lightweight toast notifications |
| Image Storage | Cloudinary | Product image uploads, free 25GB tier |
| Payments | Razorpay | UPI, cards, net banking — India-first |
| State (cart) | Zustand | Client-side cart, no DB needed for v1 |
| HTTP client (BE) | httpx | Async HTTP client for external API calls |
| Frontend Deploy | Vercel | Free tier, auto-deploys from GitHub |
| Backend Deploy | Railway | Free tier, Postgres + FastAPI together |

---

## Folder Structure

```
project/
├── backend/
│   ├── main.py               # FastAPI app entry point, routers registered here
│   ├── config.py             # Pydantic-settings config (reads from .env)
│   ├── database.py           # Async SQLAlchemy engine + session factory
│   ├── exceptions.py         # Custom exception classes + FastAPI handlers
│   ├── dependencies.py       # JWT auth guard (get_current_user)
│   ├── models/
│   │   ├── user.py
│   │   ├── product.py
│   │   └── order.py
│   ├── schemas/
│   │   ├── user.py
│   │   ├── product.py
│   │   └── order.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── products.py
│   │   ├── orders.py
│   │   ├── sellers.py
│   │   ├── payments.py
│   │   └── admin.py
│   ├── services/             # Business logic — routers call services, not DB directly
│   │   ├── auth.py           # register, login, token refresh
│   │   ├── product.py        # create, update, delete, list products
│   │   ├── order.py          # place order, fetch history
│   │   └── payment.py        # Razorpay create + verify
│   ├── utils/
│   │   └── cloudinary.py     # Image upload helper
│   ├── requirements.txt
│   └── .env
│
└── frontend/
    ├── app/
    │   ├── layout.tsx                          # Root layout (ThemeProvider, Toaster)
    │   ├── page.tsx                            # Home / storefront
    │   ├── (auth)/
    │   │   └── login/page.tsx                 # Shared login for buyer + seller
    │   ├── products/
    │   │   ├── page.tsx                        # Product listing
    │   │   └── [id]/page.tsx                  # Product detail
    │   ├── cart/page.tsx
    │   ├── checkout/page.tsx
    │   ├── seller/
    │   │   ├── dashboard/page.tsx
    │   │   ├── orders/page.tsx
    │   │   └── products/
    │   │       ├── new/page.tsx
    │   │       └── [id]/edit/page.tsx
    │   └── admin/page.tsx
    ├── actions/                                # Next.js Server Actions ("use server")
    │   ├── auth-actions.ts                    # login, logout, register
    │   ├── product-actions.ts                 # CRUD + image upload
    │   └── order-actions.ts                   # place order, fetch history
    ├── components/
    │   ├── ui/                                # shadcn/ui components (Button, Input, etc.)
    │   ├── Navbar.tsx
    │   ├── ProductCard.tsx
    │   ├── CartDrawer.tsx
    │   └── SellerLayout.tsx
    ├── hooks/
    │   └── use-cart.ts                        # Thin wrapper over Zustand cart store
    ├── lib/
    │   ├── api-client.ts      # Server-only fetch wrapper (import "server-only")
    │   └── auth.ts            # Token helpers (read/clear cookie — server-only)
    ├── providers/
    │   └── providers.tsx      # ThemeProvider + Toaster wrapped together
    ├── store/
    │   └── cart.ts            # Zustand cart store
    ├── types/
    │   └── index.ts           # Shared TypeScript types
    ├── middleware.ts           # Protect /seller and /admin routes
    └── .env.local
```

---

## Backend Architecture Patterns

### Async all the way
Every route and service uses async functions. The asyncpg driver ensures no thread is blocked on database queries.

### Config via pydantic-settings
All environment variables are loaded through a typed Settings class. This covers the database URL, JWT secret, Cloudinary credentials, and Razorpay keys.

### Service layer pattern
Routers handle HTTP concerns only. Business logic lives in the services layer — routers call services, not the database directly.

### Custom exceptions
Custom exception classes are defined for cases like product not found or unauthorized seller, with handlers registered at the app level to return consistent JSON error responses.

---

## Frontend Architecture Patterns

### Server Actions instead of client-side fetch
All API calls go through server-side actions — the server reads the auth cookie directly. No token is ever exposed to client-side JavaScript.

### Server-only API client
The API client is restricted to server-side use only. It reads the access token from cookies and attaches it as a Bearer header on every request to the FastAPI backend. The base URL is an internal env variable not exposed to the browser.

### Forms with React Hook Form + Zod
All forms use React Hook Form with a Zod schema for validation. This gives type-safe validation on the frontend before anything hits the server.

---

## Database Tables

### users
```
id            UUID  PK
email         TEXT  UNIQUE NOT NULL
password_hash TEXT  NOT NULL
role          TEXT  DEFAULT 'buyer'  -- 'buyer' | 'seller' | 'admin'
created_at    TIMESTAMP WITH TIME ZONE
updated_at    TIMESTAMP WITH TIME ZONE
deleted_at    TIMESTAMP WITH TIME ZONE  -- soft delete, NULL = active
```

### refresh_tokens
```
id            UUID  PK
user_id       UUID  FK → users.id  CASCADE DELETE
token_hash    TEXT  UNIQUE NOT NULL   -- store hash, not raw token
expires_at    TIMESTAMP WITH TIME ZONE
revoked_at    TIMESTAMP WITH TIME ZONE  -- NULL = still valid
created_at    TIMESTAMP WITH TIME ZONE
```

### seller_profiles
```
id            UUID  PK
user_id       UUID  FK → users.id
shop_name     TEXT
description   TEXT
is_approved   BOOLEAN  DEFAULT false
```

### products
```
id            UUID  PK
seller_id     UUID  FK → users.id
name          TEXT
description   TEXT
price         NUMERIC
stock         INTEGER
category      TEXT
status        TEXT  DEFAULT 'pending'  -- 'pending' | 'approved' | 'rejected'
created_at    TIMESTAMP WITH TIME ZONE
updated_at    TIMESTAMP WITH TIME ZONE
deleted_at    TIMESTAMP WITH TIME ZONE  -- soft delete
```

### product_images
```
id            UUID  PK
product_id    UUID  FK → products.id
url           TEXT
is_primary    BOOLEAN
```

### orders
```
id                UUID  PK
buyer_id          UUID  FK → users.id
total_amount      NUMERIC
status            TEXT  DEFAULT 'pending'  -- 'pending' | 'confirmed' | 'shipped' | 'delivered'
delivery_address  TEXT
created_at        TIMESTAMP WITH TIME ZONE
```

### order_items
```
id          UUID  PK
order_id    UUID  FK → orders.id
product_id  UUID  FK → products.id
quantity    INTEGER
unit_price  NUMERIC
```

### payments
```
id                    UUID  PK
order_id              UUID  FK → orders.id
razorpay_order_id     TEXT
razorpay_payment_id   TEXT
razorpay_signature    TEXT
status                TEXT  -- 'created' | 'paid' | 'failed'
```

---

## FastAPI Routes

### Auth — `/auth`
- POST /auth/register — Register buyer or seller
- POST /auth/login — Returns access token (cookie) + refresh token (cookie)
- POST /auth/refresh — Rotate refresh token, return new access token
- POST /auth/logout — Revoke refresh token, clear cookies
- GET /auth/me — Get current user (requires token)

### Products — `/products`
- GET /products — List all approved products (filter, paginate)
- GET /products/{id} — Single product detail
- POST /products — Seller creates product (auth required)
- PUT /products/{id} — Seller edits own product (auth required)
- DELETE /products/{id} — Seller soft-deletes own product (auth required)
- POST /products/{id}/images — Upload image to Cloudinary, save URL

### Orders — `/orders`
- POST /orders — Buyer places order
- GET /orders/my — Buyer's own order history

### Seller — `/seller`
- GET /seller/orders — All orders for seller's products
- PUT /seller/orders/{id} — Update order status (shipped, delivered)

### Payments — `/payments`
- POST /payments/create-order — Create Razorpay order, returns order_id
- POST /payments/verify — Verify payment signature, confirm order

### Admin — `/admin`
- GET /admin/sellers — List all seller profiles (pending + approved)
- POST /admin/sellers/{id}/approve — Approve a seller
- POST /admin/products/{id}/approve — Approve a product listing
- POST /admin/products/{id}/reject — Reject a product listing

---

## Auth Flow

1. Buyer/seller submits email + password to `POST /auth/login`
2. FastAPI verifies password hash, returns:
   - **access_token** (15 min) → `httpOnly` cookie
   - **refresh_token** (7 days) → `httpOnly` cookie, stored as hash in DB
3. Every server action reads the cookie server-side — never exposed to client JS
4. When access token expires, middleware calls `POST /auth/refresh` silently
5. FastAPI validates refresh token hash, rotates it (old one revoked), returns new pair
6. Next.js `middleware.ts` checks the cookie on `/seller/*` and `/admin/*` — redirects to login if missing
7. On logout, refresh token is revoked in DB and both cookies are cleared

---

## Razorpay Payment Flow

```
1. Buyer clicks "Pay Now" on checkout page
        ↓
2. Server action calls POST /payments/create-order
   FastAPI creates a Razorpay order via httpx (async)
   Returns { razorpay_order_id, amount, currency }
        ↓
3. Frontend opens Razorpay checkout widget (JS SDK)
   Buyer pays via UPI / card / net banking
        ↓
4. Razorpay returns { payment_id, order_id, signature } to frontend
        ↓
5. Server action calls POST /payments/verify with those 3 values
   FastAPI verifies the HMAC signature server-side
        ↓
6. Signature valid → create order in DB, mark payment as 'paid'
   Signature invalid → return 400, do not create order
```

> Never trust the frontend to confirm payment. Always verify the Razorpay signature on the server.

---

## Image Upload Flow (Cloudinary)

```
1. Seller selects image in the product form
2. Server action sends file to POST /products/{id}/images
3. FastAPI uploads file to Cloudinary using the Python SDK
4. Cloudinary returns a secure URL
5. FastAPI saves the URL to product_images table
6. Frontend displays the Cloudinary URL directly (no presigned URL needed — Cloudinary manages access)
```

---

## Next.js Key Decisions

### Cart → Zustand (client-side only)
No login needed to add to cart. Cart is stored in browser memory and persisted to localStorage. On checkout, the buyer logs in, then the server action creates the order.

### Route protection (middleware.ts)
`middleware.ts` checks for the `access_token` cookie on all `/seller/*` and `/admin/*` routes. If missing, redirects to `/login`.

### Root layout with providers
The root layout wraps the app in `ThemeProvider` (next-themes) and renders the `Toaster` (sonner) for global toast notifications.

---

## Environment Variables

### backend/.env
- DATABASE_URL
- SECRET_KEY (min 32 chars)
- ALGORITHM (HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES (15)
- REFRESH_TOKEN_EXPIRE_DAYS (7)
- CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
- RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET

### frontend/.env.local
- API_URL — internal server-to-server URL, not exposed to browser
- NEXT_PUBLIC_API_URL — only needed for Razorpay widget callback
- NEXT_PUBLIC_RAZORPAY_KEY_ID

---

## Python Dependencies

**Core:** fastapi, uvicorn[standard], sqlalchemy[asyncio], asyncpg, alembic, psycopg2-binary (Alembic only), python-jose[cryptography], passlib[bcrypt], python-multipart, pydantic[email], pydantic-settings, httpx, cloudinary, razorpay, python-dotenv

**Dev:** ruff, black, pytest, pytest-asyncio

---

## Build Order (Week by Week)

### Week 1 — Foundation
- [ ] Set up FastAPI project with `config.py` (pydantic-settings) and async SQLAlchemy
- [ ] Create all models with UUID PKs, `created_at`, `deleted_at`
- [ ] Run first Alembic migration (use psycopg2 URL for Alembic, asyncpg URL for runtime)
- [ ] Build `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout`
- [ ] Set up Next.js with Tailwind + shadcn/ui init (`npx shadcn@latest init`)
- [ ] Build login page with React Hook Form + Zod validation
- [ ] Test auth end-to-end with token refresh

### Week 2 — Seller Side
- [ ] Build `/products` POST, PUT, DELETE routes (service layer pattern)
- [ ] Cloudinary image upload endpoint
- [ ] Seller dashboard (server component fetches products via server action)
- [ ] Add product form with validation (shadcn Form + Zod)
- [ ] Edit product page
- [ ] Product pending approval state

### Week 3 — Buyer Storefront
- [ ] Build `/products` GET with filters (category, price, search via ILIKE)
- [ ] Home page with featured products (server component)
- [ ] Product listing with filter sidebar
- [ ] Product detail page
- [ ] Cart (Zustand with `persist` middleware — survives page refresh)
- [ ] Cart drawer UI using shadcn Sheet component

### Week 4 — Payments & Orders
- [ ] Checkout page (delivery address form with Zod validation)
- [ ] Razorpay: `POST /payments/create-order` via httpx + verify endpoint
- [ ] Razorpay JS SDK integration in Next.js (client component)
- [ ] Order creation in DB after payment verified
- [ ] Buyer order history page
- [ ] Seller order management (view + update status)

### Week 5 — Admin & Deploy
- [ ] Admin panel: approve/reject sellers and products
- [ ] Set one user as admin directly in DB
- [ ] Deploy FastAPI to Railway (add Postgres on Railway too)
- [ ] Deploy Next.js to Vercel
- [ ] Set all environment variables in both platforms
- [ ] End-to-end test: seller signup → product upload → buyer purchase → order confirmed

---

## Admin Setup (one-time)

After deploying, run an SQL update directly in your database to set `role = 'admin'` for your email address. No admin signup page needed in v1.

---

## What to Skip in V1

| Feature | Why skip | Add in V2 |
|---|---|---|
| Email notifications | Needs SMTP setup | Use Resend or SendGrid |
| Seller payouts | Complex compliance | Razorpay Route |
| Search (full-text) | PostgreSQL ILIKE is fine for v1 | Elasticsearch / Typesense |
| Reviews & ratings | Nice to have | After order delivered |
| Multi-image carousel | One primary image is enough | After core works |
| Discount codes | Extra DB table + logic | V2 |
| Guest checkout | Forces login at checkout for now | V2 |
| WebSocket / real-time order updates | Polling is fine for v1 | V2 |
