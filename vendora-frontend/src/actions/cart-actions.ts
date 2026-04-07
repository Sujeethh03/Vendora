"use server"

import { apiClient } from "@/lib/api-client"
import { CartResponse, ActionResult } from "@/types"

export async function getCart(): Promise<CartResponse | null> {
    try {
        return await apiClient.get<CartResponse>("/cart")
    } catch (error: any) {
        // 401 means user is not logged in — not an error worth logging
        if (error.status === 401) return null
        console.error("Failed to fetch cart:", error)
        return null
    }
}

export async function addToCart(
    productId: string,
    quantity: number
): Promise<ActionResult<CartResponse>> {
    try {
        const cart = await apiClient.post<CartResponse>("/cart/items", { product_id: productId, quantity })
        return { success: true, data: cart }
    } catch (error: any) {
        console.error("Failed to add to cart:", error)
        return { success: false, error: error.message || "Failed to update cart" }
    }
}

export async function removeFromCart(productId: string): Promise<ActionResult> {
    try {
        await apiClient.delete(`/cart/items/${productId}`)
        return { success: true }
    } catch (error: any) {
        console.error("Failed to remove from cart:", error)
        return { success: false, error: error.message || "Failed to remove item" }
    }
}

export async function clearCart(): Promise<ActionResult> {
    try {
        await apiClient.delete("/cart")
        return { success: true }
    } catch (error: any) {
        console.error("Failed to clear cart:", error)
        return { success: false, error: error.message || "Failed to clear cart" }
    }
}
