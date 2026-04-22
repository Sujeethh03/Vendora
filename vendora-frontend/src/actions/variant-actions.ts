"use server"

import { apiClient } from "@/lib/api-client"
import { ProductVariant, ActionResult } from "@/types"
import { revalidatePath } from "next/cache"

export async function createVariant(
    productId: string,
    data: { label: string; price: number; stock: number }
): Promise<ActionResult<ProductVariant>> {
    try {
        const variant = await apiClient.post<ProductVariant>(`/products/${productId}/variants`, data)
        revalidatePath(`/dashboard/products/${productId}`)
        revalidatePath(`/products/${productId}`)
        return { success: true, data: variant }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create variant" }
    }
}

export async function updateVariant(
    productId: string,
    variantId: string,
    data: { label?: string; price?: number; stock?: number }
): Promise<ActionResult<ProductVariant>> {
    try {
        const variant = await apiClient.put<ProductVariant>(
            `/products/${productId}/variants/${variantId}`,
            data
        )
        revalidatePath(`/dashboard/products/${productId}`)
        revalidatePath(`/products/${productId}`)
        return { success: true, data: variant }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update variant" }
    }
}

export async function deleteVariant(
    productId: string,
    variantId: string
): Promise<ActionResult> {
    try {
        await apiClient.delete(`/products/${productId}/variants/${variantId}`)
        revalidatePath(`/dashboard/products/${productId}`)
        revalidatePath(`/products/${productId}`)
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete variant" }
    }
}
