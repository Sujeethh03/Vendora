"use server"

import { apiClient } from "@/lib/api-client"
import { Product, ProductImage, ProductsResponse, ActionResult } from "@/types"
import { revalidatePath } from "next/cache"

interface GetProductsParams {
    search?: string
    category?: string
    min_price?: string
    max_price?: string
    page?: string
    page_size?: string
    seller_id?: string
}

export async function getProducts(params: GetProductsParams = {}): Promise<ProductsResponse> {
    try {
        const queryParams: Record<string, string> = {}
        if (params.search) queryParams.search = params.search
        if (params.category) queryParams.category = params.category
        if (params.min_price) queryParams.min_price = params.min_price
        if (params.max_price) queryParams.max_price = params.max_price
        if (params.page) queryParams.page = params.page
        if (params.page_size) queryParams.page_size = params.page_size
        if (params.seller_id) queryParams.seller_id = params.seller_id

        return await apiClient.get<ProductsResponse>("/products", { params: queryParams })
    } catch (error: any) {
        console.error("Failed to fetch products:", error)
        return { items: [], total: 0, page: 1, page_size: 20 }
    }
}

export async function getProduct(id: string): Promise<Product | null> {
    try {
        return await apiClient.get<Product>(`/products/${id}`)
    } catch (error: any) {
        console.error("Failed to fetch product:", error)
        return null
    }
}

export async function createProduct(data: {
    name: string
    description?: string
    price: number
    stock: number
    category?: string
}): Promise<ActionResult<Product>> {
    try {
        const product = await apiClient.post<Product>("/products", data)
        revalidatePath("/dashboard")
        return { success: true, data: product }
    } catch (error: any) {
        console.error("Failed to create product:", error)
        return { success: false, error: error.message || "Failed to create product" }
    }
}

export async function updateProduct(
    id: string,
    data: {
        name?: string
        description?: string
        price?: number
        stock?: number
        category?: string
    }
): Promise<ActionResult<Product>> {
    try {
        const product = await apiClient.put<Product>(`/products/${id}`, data)
        revalidatePath("/dashboard")
        revalidatePath(`/dashboard/products/${id}`)
        return { success: true, data: product }
    } catch (error: any) {
        console.error("Failed to update product:", error)
        return { success: false, error: error.message || "Failed to update product" }
    }
}

export async function deleteProduct(id: string): Promise<ActionResult> {
    try {
        await apiClient.delete(`/products/${id}`)
        revalidatePath("/dashboard")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete product:", error)
        return { success: false, error: error.message || "Failed to delete product" }
    }
}

export async function uploadProductImage(productId: string, formData: FormData): Promise<ActionResult<ProductImage>> {
    try {
        const file = formData.get("file") as File
        const backendForm = new FormData()
        backendForm.append("file", file)
        const image = await apiClient.postForm<ProductImage>(`/products/${productId}/images`, backendForm)
        revalidatePath(`/dashboard/products/${productId}`)
        return { success: true, data: image }
    } catch (error: any) {
        console.error("Failed to upload image:", error)
        return { success: false, error: error.message || "Failed to upload image" }
    }
}

export async function deleteProductImage(productId: string, imageId: string): Promise<ActionResult> {
    try {
        await apiClient.delete(`/products/${productId}/images/${imageId}`)
        revalidatePath(`/dashboard/products/${productId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to delete image:", error)
        return { success: false, error: error.message || "Failed to delete image" }
    }
}

export async function setPrimaryImage(productId: string, imageId: string): Promise<ActionResult<ProductImage>> {
    try {
        const image = await apiClient.patch<ProductImage>(`/products/${productId}/images/${imageId}/primary`)
        revalidatePath(`/dashboard/products/${productId}`)
        return { success: true, data: image }
    } catch (error: any) {
        console.error("Failed to set primary image:", error)
        return { success: false, error: error.message || "Failed to set primary image" }
    }
}
