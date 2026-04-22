# Vendora — Feature Roadmap

## Must-Have (Core Shopping Experience)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 1 | **Shopping Cart** | Add/remove items, quantity control, persisted across sessions | Pending |
| 2 | **Checkout & Orders** | Place an order, order confirmation, order history for buyers | Pending |
| 3 | **Payments** | Razorpay integration (already in dependencies, needs wiring up) | Pending |
| 4a | **Product Variants / Weight Options** | Products available in multiple sizes or weights (e.g. 500g vs 1kg), buyer selects before adding to cart | Done |
| 4b | **Minimum Order Value** | Enforce a minimum cart total before checkout is allowed | Done |

---

## High Impact (Trust & Discovery)

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 4 | **Product Reviews & Ratings** | Buyers rate products after purchase, average rating shown on cards | Pending |


| 6 | **Product Categories & Filtering** | Categories already in DB, needs proper UI (sidebar/pills) | Pending |

---

## Buyer Experience

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 7 | **Wishlist** | Save products for later | Pending |
| 8 | **Order Tracking** | Order status updates (processing → shipped → delivered) | Pending |
| 9 | **Email Notifications** | Order confirmation, shipping updates, back-in-stock, and deal alerts | Pending |
| 13 | **Reorder from Past Orders** | One-click reorder of a previous order directly into cart | Pending |
| 14 | **Saved Delivery Addresses** | Buyers save multiple addresses (home/work/other) and pick at checkout | Pending |
| 15 | **Recently Viewed & Frequently Bought** | Show recently browsed products and items commonly bought together | Pending |

---

## Admin Experience

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 10 | **Dashboard Analytics** | Total sales, revenue, top products, recent orders | Pending |
| 11 | **Inventory Alerts** | Notify admin when stock runs low | Pending |
| 12 | **Bulk Product Management** | Import/export products via CSV | Pending |
| 16 | **Product Expiry Date Tracking** | Admin sets expiry dates; auto-hide or flag near-expiry products | Pending |

---

## Grocery-Specific

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 17 | **Delivery Slot Scheduling** | Buyer picks a date and time window for delivery at checkout | Pending |
| 18 | **Delivery Zones / Pincode Check** | Validate buyer's pincode is serviceable before allowing checkout | Pending |
| 19 | **Recurring / Subscription Orders** | Buyers subscribe to repeat an order weekly/monthly (e.g. daily milk) | Pending |

---

## Promotions & Loyalty

| # | Feature | Description | Status |
|---|---------|-------------|--------|
| 20 | **Quantity-Based Discounts** | Tiered pricing — e.g. buy 3 get 10% off, buy 6 get 20% off | Pending |
| 21 | **Flash Sales with Countdown Timer** | Time-limited discounts with a visible timer on product cards | Pending |
| 22 | **Loyalty Points / Reward Credits** | Earn points on purchases, redeem as store credit on future orders | Pending |
| 23 | **Bundle Deals / Combo Offers** | Group products into a discounted bundle (e.g. breakfast combo) | Pending |

---

## Recommended Build Order

1. **Cart** → **Checkout** → **Payments** → **Orders** — completes the core buying loop
2. **Product Variants / Weight Options** + **Minimum Order Value** — grocery essentials
3. **Delivery Slot Scheduling** + **Delivery Zones / Pincode Check** — delivery ops
4. **Discounts** + **Quantity-Based Discounts** — drives conversions
5. **Reorder** + **Saved Addresses** — friction reduction for repeat buyers
6. **Reviews & Ratings** — builds trust after real purchases exist
7. **Loyalty Points** + **Subscriptions** — retention layer
8. **Flash Sales** + **Bundles** — marketing tools
9. **Analytics** + **Expiry Tracking** — meaningful once sales data accumulates
