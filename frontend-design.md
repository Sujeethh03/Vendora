# Vendora — Frontend Design Guide
### Stack: Next.js 14 (App Router)

---

## Tech Stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router) | File-based routing, server components, server actions |
| Validation | Zod + React Hook Form | Type-safe form validation on the frontend |
| UI Components | shadcn/ui + Radix UI | Accessible, composable component primitives |
| Styling | Tailwind CSS | Utility-first, fast to build |
| Theming | next-themes | Dark/light mode toggle, stored in localStorage |
| Toasts | sonner | Lightweight toast notifications |
| State (cart) | Zustand | Client-side cart, no DB needed for v1 |
| Payments | Razorpay JS SDK | UPI, cards, net banking — India-first |
| Deploy | Vercel | Free tier, auto-deploys from GitHub |

---

## Folder Structure

```
frontend/
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

## Architecture Patterns

### Server Actions instead of client-side fetch
All API calls go through server-side actions — the server reads the auth cookie directly. No token is ever exposed to client-side JavaScript.

### Server-only API client
The API client is restricted to server-side use only. It reads the access token from cookies and attaches it as a Bearer header on every request to the FastAPI backend. The base URL is an internal env variable not exposed to the browser.

### Forms with React Hook Form + Zod
All forms use React Hook Form with a Zod schema for validation. This gives type-safe validation on the frontend before anything hits the server.

---

## Key Decisions

### Cart → Zustand (client-side only)
No login needed to add to cart. Cart is stored in browser memory and persisted to localStorage with the `persist` middleware — survives page refresh. On checkout, the buyer logs in, then the server action creates the order.

### Route protection (middleware.ts)
`middleware.ts` checks for the `access_token` cookie on all `/seller/*` and `/admin/*` routes. If missing, redirects to `/login`.

### Root layout with providers
The root layout wraps the app in `ThemeProvider` (next-themes) and renders the `Toaster` (sonner) for global toast notifications.

---

## Auth Flow (Frontend Side)

1. Buyer/seller submits email + password via login form (React Hook Form + Zod)
2. Server action calls `POST /auth/login` — tokens arrive as `httpOnly` cookies, never in JS
3. On protected pages, `middleware.ts` checks the `access_token` cookie on `/seller/*` and `/admin/*` — redirects to `/login` if missing
4. When access token expires, middleware silently calls `POST /auth/refresh`
5. On logout, server action calls `POST /auth/logout` and clears cookies

---

## Razorpay Payment Flow (Frontend Side)

```
1. Buyer clicks "Pay Now" on checkout page
        ↓
2. Server action calls POST /payments/create-order
   Returns { razorpay_order_id, amount, currency }
        ↓
3. Frontend opens Razorpay checkout widget (JS SDK — client component)
   Buyer pays via UPI / card / net banking
        ↓
4. Razorpay returns { payment_id, order_id, signature } to frontend
        ↓
5. Server action calls POST /payments/verify with those 3 values
   Backend verifies HMAC signature — never trust frontend to confirm payment
        ↓
6. On success → redirect to order confirmation page
```

---

## Image Upload Flow (Frontend Side)

```
1. Seller selects image in the product form
2. Server action sends file to POST /products/{id}/images
3. Backend uploads to Cloudinary and saves the URL
4. Frontend displays the returned Cloudinary URL directly
```

---

## Environment Variables

### frontend/.env.local
- `API_URL` — internal server-to-server URL, not exposed to browser
- `NEXT_PUBLIC_API_URL` — only needed for Razorpay widget callback
- `NEXT_PUBLIC_RAZORPAY_KEY_ID`

---

## Build Order

### Week 1 — Foundation
- [ ] Set up Next.js with Tailwind + shadcn/ui init (`npx shadcn@latest init`)
- [ ] Build login page with React Hook Form + Zod validation
- [ ] Test auth end-to-end with token refresh

### Week 2 — Seller Side
- [ ] Seller dashboard (server component fetches products via server action)
- [ ] Add product form with validation (shadcn Form + Zod)
- [ ] Edit product page

### Week 3 — Buyer Storefront
- [ ] Home page with featured products (server component)
- [ ] Product listing with filter sidebar
- [ ] Product detail page
- [ ] Cart (Zustand with `persist` middleware — survives page refresh)
- [ ] Cart drawer UI using shadcn Sheet component

### Week 4 — Payments & Orders
- [ ] Checkout page (delivery address form with Zod validation)
- [ ] Razorpay JS SDK integration in Next.js (client component)
- [ ] Buyer order history page
- [ ] Seller order management (view + update status)

### Week 5 — Deploy
- [ ] Deploy Next.js to Vercel
- [ ] Set all environment variables in Vercel
- [ ] End-to-end test: seller signup → product upload → buyer purchase → order confirmed

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
