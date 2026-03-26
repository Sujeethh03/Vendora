# Vendora Frontend

The frontend for Vendora — a marketplace platform where sellers can list products and admins can manage approvals.

Built with Next.js 16 (App Router), TypeScript, shadcn/ui, and Tailwind CSS. Follows the same structure and patterns as quantjo-ui-saas.

---

## Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.1 (App Router) |
| Language | TypeScript 5 |
| UI Components | shadcn/ui (New York style) + Radix UI |
| Styling | Tailwind CSS |
| Icons | Lucide React |
| Forms | React Hook Form + Zod |
| Tables | TanStack React Table |
| Theme | next-themes (light/dark) |
| Notifications | Sonner (toasts) |
| Font | Inter |

---

## Project Structure

```
vendora-frontend/
├── src/
│   ├── app/
│   │   ├── (auth)/                          # Auth route group (centered card layout)
│   │   │   ├── layout.tsx
│   │   │   ├── login/page.tsx               # Login form
│   │   │   └── register/page.tsx            # Register form
│   │   ├── (dashboard)/                     # Dashboard route group (sidebar layout)
│   │   │   ├── layout.tsx                   # Async server component — fetches user, renders sidebar
│   │   │   └── dashboard/
│   │   │       ├── page.tsx                 # My Listings — TanStack table + empty state
│   │   │       └── products/
│   │   │           ├── new/page.tsx         # Create product form
│   │   │           └── [id]/
│   │   │               ├── page.tsx         # Edit product (server wrapper, fetches product)
│   │   │               └── edit-product-form.tsx  # Client-side pre-filled form
│   │   ├── admin/page.tsx                   # Admin panel — Products + Sellers tabs
│   │   ├── page.tsx                         # Marketplace — search/filter/grid/pagination
│   │   ├── layout.tsx                       # Root layout — fonts, ThemeProvider, AuthProvider
│   │   └── globals.css                      # CSS variables (light/dark), custom scrollbar
│   ├── actions/
│   │   ├── auth-actions.ts                  # login, register, logout, getMe
│   │   ├── product-actions.ts               # getProducts, getProduct, createProduct, updateProduct, deleteProduct
│   │   └── admin-actions.ts                 # getSellers, approveSeller, approveProduct, rejectProduct
│   ├── components/
│   │   ├── providers/
│   │   │   ├── auth-provider.tsx            # AuthContext — user, isLoading, login, logout, register
│   │   │   └── theme-provider.tsx           # next-themes wrapper
│   │   ├── features/
│   │   │   ├── navbar.tsx                   # Public navbar — logo, login/register or user dropdown
│   │   │   ├── dashboard-sidebar.tsx        # Sidebar — nav items, user avatar, logout, theme toggle
│   │   │   ├── mobile-nav.tsx               # Sheet-based mobile sidebar
│   │   │   ├── product-card.tsx             # Marketplace product card — name, category, price, seller
│   │   │   ├── products-table.tsx           # TanStack table — Name, Category, Price, Stock, Actions
│   │   │   └── confirm-delete-dialog.tsx    # AlertDialog for delete confirmation
│   │   ├── ui/                              # shadcn/ui components
│   │   │   ├── alert-dialog.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── dropdown-menu.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── label.tsx
│   │   │   ├── select.tsx
│   │   │   ├── separator.tsx
│   │   │   ├── sheet.tsx
│   │   │   ├── skeleton.tsx
│   │   │   ├── sonner.tsx
│   │   │   ├── table.tsx
│   │   │   ├── tabs.tsx
│   │   │   └── textarea.tsx
│   │   └── theme-toggle.tsx
│   ├── lib/
│   │   ├── api-client.ts                    # server-only — cookie Bearer auth, ApiError class
│   │   ├── config.ts                        # API_URL from env
│   │   └── utils.ts                         # cn() — clsx + tailwind-merge
│   ├── proxy.ts                             # Protects /dashboard/* and /admin/*
│   └── types/
│       └── index.ts                         # User, Product, Seller, ActionResult types
├── components.json                          # shadcn config — New York style, zinc base
├── tailwind.config.ts
├── tsconfig.json
├── next.config.ts
├── postcss.config.mjs
└── package.json
```

---

## Routes

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Marketplace — browse all approved products |
| `/login` | Public | Login with email + password |
| `/register` | Public | Create a new seller account |
| `/dashboard` | Auth | My Listings — view, edit, delete your products |
| `/dashboard/products/new` | Auth | Create a new product listing |
| `/dashboard/products/[id]` | Auth | Edit an existing product |
| `/admin` | Admin only | Approve/reject products and sellers |

---

## API Endpoints Used

### Auth
| Method | Endpoint | Used In |
|--------|----------|---------|
| `POST` | `/auth/login` | `/login` |
| `POST` | `/auth/register` | `/register` |
| `POST` | `/auth/logout` | Sidebar logout button |
| `POST` | `/auth/refresh` | Silent token refresh |
| `GET` | `/auth/me` | App init, dashboard layout |

### Products
| Method | Endpoint | Used In |
|--------|----------|---------|
| `GET` | `/products` | `/` marketplace |
| `GET` | `/products?seller_id=` | `/dashboard` |
| `GET` | `/products/{id}` | Edit product page |
| `POST` | `/products` | Create product form |
| `PUT` | `/products/{id}` | Edit product form |
| `DELETE` | `/products/{id}` | Dashboard table row |

### Admin
| Method | Endpoint | Used In |
|--------|----------|---------|
| `GET` | `/admin/sellers` | `/admin` sellers tab |
| `POST` | `/admin/sellers/{id}/approve` | `/admin` sellers tab |
| `POST` | `/admin/products/{id}/approve` | `/admin` products tab |
| `POST` | `/admin/products/{id}/reject` | `/admin` products tab |

---

## Auth Flow

1. User visits `/` — can browse without logging in
2. Login → tokens stored as **httpOnly cookies** (`access_token`, `refresh_token`)
3. All API calls from **server actions only** — token read from cookies server-side
4. `middleware.ts` guards `/dashboard/*` and `/admin/*` — redirects to `/login` if no cookie
5. On 401 → call `POST /auth/refresh` silently → retry → if fails, redirect to `/login`
6. Logout → `POST /auth/logout` → delete cookies → redirect to `/`

---

## Getting Started

### Prerequisites
- Node.js 18+
- Vendora backend running at `http://localhost:8000`

### Setup

```bash
# Install dependencies
npm install

# Copy env file and set your API URL
cp .env.example .env
```

**.env**
```
API_URL=http://localhost:8000
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Run

```bash
# Development
npm run dev

# Production build
npm run build
npm start
```

Open [http://localhost:3000](http://localhost:3000).

---

## Key Architecture Decisions

- **Server Actions over client fetch** — all API calls go through `"use server"` actions, keeping tokens server-side only
- **`server-only` API client** — `lib/api-client.ts` is marked `import "server-only"` so it can never accidentally run in the browser
- **httpOnly cookies** — auth tokens are never exposed to JavaScript
- **Context API for auth state** — `AuthProvider` wraps the app, exposes `useAuth()` hook
- **Route groups** — `(auth)` and `(dashboard)` give each section its own layout without affecting URLs
- **TanStack React Table** — used for the seller product table with sorting and empty states
- **`revalidatePath`** — called after every mutation to keep server-rendered pages fresh
