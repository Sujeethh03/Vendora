export interface User {
    id: string
    email: string
    role: "buyer" | "seller"
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

export interface ActionResult<T = void> {
    success: boolean
    data?: T
    error?: string
}
