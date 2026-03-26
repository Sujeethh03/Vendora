

# Vendora Frontend Design Doc

## Stack
- **Framework:** Next.js (App Router) + TypeScript
- **UI:** shadcn/ui (New York style) + Tailwind CSS
- **Icons:** Lucide React
- **Forms:** React Hook Form + Zod
- **Fonts:** Inter (sans-serif)
- **Theme:** Light + Dark mode via next-themes
- **Notifications:** Sonner (toasts)

---

## Design Language (inspired by quantjo-ui-saas)

### Colors
- **Light mode:** White background, dark charcoal text, gray borders
- **Dark mode:** `#0a0a0a` background, near-white text, zinc-based surfaces
- **Primary action:** Dark button (light mode) / White button (dark mode)
- **Destructive:** Red (`destructive` variant)
- **Muted text:** `text-muted-foreground` for secondary labels

### Typography
- Headings: `text-3xl font-bold tracking-tight`
- Card titles: `text-xl font-semibold`
- Body: `text-sm`
- Secondary labels: `text-xs text-muted-foreground`

### Components
- Cards with `rounded-lg shadow-sm border`
- Buttons: `default`, `outline`, `ghost`, `destructive`
- Forms: React Hook Form with inline field-level error messages
- Tables: TanStack React Table with sorting, empty states, skeleton loading
- Dialogs for create/edit/delete confirmations
- Toasts for success/error feedback

---

## App Structure

```
/                        → Marketplace (public)
/login                   → Login page
/register                → Register page
/dashboard               → My listings (logged-in)
/dashboard/products/new  → Create product
/dashboard/products/[id] → Edit product
/admin                   → Admin panel (admin only)
```

---

## Pages

---

### `/` — Marketplace

**Purpose:** Public product listing. Anyone can browse.

**Layout:** Full-width page with top navbar (logo + login/register or user menu)

**Sections:**
- **Search & Filter Bar**
  - Text search input (queries `?search=`)
  - Category dropdown (queries `?category=`)
  - Min / Max price inputs
  - Results count label: `"Showing 24 of 120 products"`

- **Product Grid**
  - `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4`
  - Each card shows: product name, category badge, price, seller name
  - Clicking a card opens the product detail page
  - Skeleton loading cards while fetching

- **Pagination**
  - Previous / Next buttons
  - Current page indicator

**API calls:**
- `GET /products?search=&category=&min_price=&max_price=&page=&page_size=`

---

### `/login` — Login

**Layout:** Centered card, full-height page

**Card content:**
- Logo / App name at top
- Email + Password fields
- "Login" submit button (full width)
- Link to `/register`
- Error toast on failure

**API calls:**
- `POST /auth/login`

---

### `/register` — Register

**Layout:** Centered card, full-height page

**Card content:**
- Logo / App name at top
- Email + Password fields
- "Create Account" submit button (full width)
- Link to `/login`
- Success redirects to `/dashboard`

**API calls:**
- `POST /auth/register`

---

### `/dashboard` — My Listings

**Layout:** Sidebar + main content (same pattern as quantjo-ui-saas dashboard)

**Sidebar:**
- Logo
- Nav items: `My Listings`, `Profile` (future)
- User email at bottom
- Logout button
- Theme toggle

**Main content:**

- **Header:** `"My Listings"` heading + `"Add Product"` button (top right)
- **Product Table** (TanStack React Table)

  | Column | Details |
  |--------|---------|
  | Name | Product name, truncated |
  | Category | Badge |
  | Price | Formatted as currency |
  | Stock | Number |
  | Actions | Edit / Delete icon buttons |

- **Empty state** when no products: icon + "You haven't listed anything yet" + "Add Product" button

**API calls:**
- `GET /products?seller_id={{current_user_id}}`
- `DELETE /products/{id}` (on delete)

---

### `/dashboard/products/new` — Create Product

**Layout:** Sidebar + centered form card

**Form fields:**
- Name (required)
- Description (textarea, optional)
- Price (number input, required)
- Stock (number input, required)
- Category (text input, optional)

**Buttons:**
- `"Create Product"` (primary)
- `"Cancel"` (ghost, back to dashboard)

**On success:** Redirect to `/dashboard` + success toast

**API calls:**
- `POST /products`

---

### `/dashboard/products/[id]` — Edit Product

**Layout:** Same as create, fields pre-filled with current values

**Buttons:**
- `"Save Changes"` (primary)
- `"Cancel"` (ghost)

**On success:** Redirect to `/dashboard` + success toast

**API calls:**
- `GET /products/{id}` (prefill form)
- `PUT /products/{id}`

---

### `/admin` — Admin Panel

**Access:** Only visible/accessible to admin users. Redirect to `/` if not admin.

**Layout:** Sidebar + main content

**Sidebar:**
- Nav items: `Products`, `Sellers`

**Products tab:**
- Table of all products with `status` column (pending / approved / rejected)
- Filter by status
- Row actions: `Approve` (green), `Reject` (red)
- Confirmation dialog before approve/reject

**Sellers tab:**
- Table of all seller profiles
- `is_approved` column with badge
- Row action: `Approve`

**API calls:**
- `GET /admin/sellers`
- `POST /admin/sellers/{id}/approve`
- `POST /admin/products/{id}/approve`
- `POST /admin/products/{id}/reject`

---

## Shared Components

### Navbar (public pages)
- Logo (left)
- Right side: `Login` + `Register` buttons if not logged in; user avatar dropdown with `Dashboard` and `Logout` if logged in

### Sidebar (dashboard/admin)
- Fixed on desktop, Sheet (drawer) on mobile
- Active route highlighted with `bg-secondary`

### Product Card (marketplace)
```
┌──────────────────────┐
│  [image placeholder] │
│  Name          Badge │
│  ₹ 799.00            │
│  by seller name      │
└──────────────────────┘
```

### Confirm Delete Dialog
- Title: `"Delete Product?"`
- Description: `"This action cannot be undone."`
- Buttons: `Cancel` (outline) + `Delete` (destructive)

---

## Auth Flow

1. User visits `/` — can browse products without login
2. To create a product → redirect to `/login` if not authenticated
3. After login → redirect to `/dashboard`
4. Logout → clear cookies via `POST /auth/logout` → redirect to `/`
5. On 401 response → call `POST /auth/refresh` silently → retry request → if refresh fails, redirect to `/login`

---

## Available API Endpoints

### Auth

| Method | Endpoint | Used on |
|--------|----------|---------|
| `POST` | `/auth/register` | `/register` |
| `POST` | `/auth/login` | `/login` |
| `POST` | `/auth/refresh` | Global (silent token refresh) |
| `POST` | `/auth/logout` | Sidebar logout button |
| `GET` | `/auth/me` | App init (check session) |

### Products

| Method | Endpoint | Used on |
|--------|----------|---------|
| `GET` | `/products` | `/` marketplace |
| `GET` | `/products?seller_id=` | `/dashboard` |
| `GET` | `/products/{id}` | Edit product page |
| `POST` | `/products` | Create product form |
| `PUT` | `/products/{id}` | Edit product form |
| `DELETE` | `/products/{id}` | Dashboard table row |

### Admin

| Method | Endpoint | Used on |
|--------|----------|---------|
| `GET` | `/admin/sellers` | `/admin` sellers tab |
| `POST` | `/admin/sellers/{id}/approve` | `/admin` sellers tab |
| `POST` | `/admin/products/{id}/approve` | `/admin` products tab |
| `POST` | `/admin/products/{id}/reject` | `/admin` products tab |
