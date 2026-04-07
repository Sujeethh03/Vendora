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
    product_id: string
    product_name: string
    product_image: string | null
    price: number
    quantity: number
    subtotal: number
}

export interface CartResponse {
    items: CartItem[]
    total_items: number
    total_amount: number
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
}

export interface Order {
    id: string
    status: string
    total_amount: number
    delivery_address: DeliveryAddress
    created_at: string
    items: OrderItem[]
}

export interface OrderSummary {
    id: string
    status: string
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
