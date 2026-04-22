export interface User {
    id: string
    email: string
    is_admin: boolean
}

export interface ProductImage {
    id: string
    url: string
    is_primary: boolean
}

export interface ProductVariant {
    id: string
    label: string
    price: number
    stock: number
}

export interface Product {
    id: string
    name: string
    description?: string
    price: number
    stock: number
    category?: string
    seller_id: string
    seller_name?: string
    status: "pending" | "approved" | "rejected"
    created_at: string
    images: ProductImage[]
    variants: ProductVariant[]
}

export interface ProductsResponse {
    items: Product[]
    total: number
    page: number
    page_size: number
}

export interface LoginRequest {
    email: string
    password: string
}

export interface LoginResponse {
    access_token: string
    refresh_token: string
    token_type: string
    expires_in: number
}

export interface RegisterRequest {
    email: string
    password: string
}

export interface CartItem {
    id: string
    product_id: string
    product_name: string
    product_image: string | null
    price: number
    quantity: number
    subtotal: number
    variant_id?: string | null
    variant_label?: string | null
}

export interface CartResponse {
    items: CartItem[]
    total_items: number
    total_amount: number
    min_order_amount: number
}

export interface ValidateDiscountResult {
    discount_id: string
    code: string
    discount_type: string
    value: number
    applied_amount: number
    final_amount: number
}

export interface Discount {
    id: string
    code: string
    discount_type: "percentage" | "fixed_amount"
    value: number
    description?: string | null
    min_order_amount?: number | null
    max_uses?: number | null
    max_uses_per_user: number
    valid_from: string
    valid_until?: string | null
    is_active: boolean
    created_at: string
}

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}

export interface DeliveryAddress {
    full_name: string
    phone: string
    line1: string
    line2?: string | null
    city: string
    state: string
    pincode: string
}

export interface OrderItem {
    product_id: string | null
    product_name: string
    unit_price: number
    quantity: number
    subtotal: number
    variant_label?: string | null
}

export interface Order {
    id: string
    status: string
    subtotal: number
    discount_amount: number
    discount_code?: string | null
    total_amount: number
    delivery_address: DeliveryAddress
    created_at: string
    items: OrderItem[]
}

export interface OrderSummary {
    id: string
    status: string
    subtotal: number
    discount_amount: number
    discount_code?: string | null
    total_amount: number
    delivery_address: DeliveryAddress
    created_at: string
    item_count: number
}

export interface OrderListResponse {
    items: OrderSummary[]
    total: number
    page: number
    page_size: number
}

export interface CheckoutSession {
    order_id: string
    razorpay_order_id: string
    amount: number
    currency: string
    key_id: string
    name: string
    description: string
}
