# Vendora — Feature Roadmap

## Must-Have (Core Shopping Experience)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | **Shopping Cart** | Add/remove items, quantity control, persisted across sessions | Pending |
| 2 | **Checkout & Orders** | Place an order, order confirmation, order history for buyers | Pending |
| 3 | **Payments** | Razorpay integration (already in dependencies, needs wiring up) | Pending |

---

## High Impact (Trust & Discovery)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 4 | **Product Reviews & Ratings** | Buyers rate products after purchase, average rating shown on cards | Pending |
| 5 | **Discounts / Coupon Codes** | Percentage or fixed amount discounts on products | Pending |
| 6 | **Product Categories & Filtering** | Categories already in DB, needs proper UI (sidebar/pills) | Pending |

---

## Buyer Experience

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 7 | **Wishlist** | Save products for later | Pending |
| 8 | **Order Tracking** | Order status updates (processing → shipped → delivered) | Pending |
| 9 | **Email Notifications** | Order confirmation and shipping update emails | Pending |

---

## Admin Experience

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 10 | **Dashboard Analytics** | Total sales, revenue, top products, recent orders | Pending |
| 11 | **Inventory Alerts** | Notify admin when stock runs low | Pending |
| 12 | **Bulk Product Management** | Import/export products via CSV | Pending |

---

## Recommended Build Order

1. **Cart** → **Checkout** → **Payments** → **Orders** — completes the core buying loop
2. **Discounts** — more impactful once orders are in place
3. **Reviews & Ratings** — builds trust after real purchases exist
4. **Analytics** — meaningful once sales data accumulates
