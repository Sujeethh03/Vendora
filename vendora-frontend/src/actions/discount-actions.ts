"use server"

import { apiClient } from "@/lib/api-client"
import { Discount, ValidateDiscountResult, ActionResult } from "@/types"
import { revalidatePath } from "next/cache"

export async function validateDiscount(
    code: string,
    subtotal: number
): Promise<ActionResult<ValidateDiscountResult>> {
    try {
        const result = await apiClient.post<ValidateDiscountResult>("/discounts/validate", {
            code,
            subtotal,
        })
        return { success: true, data: result }
    } catch (error: any) {
        return { success: false, error: error.message || "Invalid coupon code" }
    }
}

export async function getDiscounts(): Promise<Discount[]> {
    try {
        return await apiClient.get<Discount[]>("/discounts")
    } catch {
        return []
    }
}

export async function createDiscount(data: {
    code: string
    discount_type: "percentage" | "fixed_amount"
    value: number
    description?: string
    min_order_amount?: number
    max_uses?: number
    max_uses_per_user: number
    valid_from: string
    valid_until?: string
}): Promise<ActionResult<Discount>> {
    try {
        const discount = await apiClient.post<Discount>("/discounts", data)
        revalidatePath("/dashboard/coupons")
        return { success: true, data: discount }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to create coupon" }
    }
}

export async function updateDiscount(
    id: string,
    data: Partial<{
        code: string
        discount_type: "percentage" | "fixed_amount"
        value: number
        description: string
        min_order_amount: number
        max_uses: number
        max_uses_per_user: number
        valid_from: string
        valid_until: string
        is_active: boolean
    }>
): Promise<ActionResult<Discount>> {
    try {
        const discount = await apiClient.put<Discount>(`/discounts/${id}`, data)
        revalidatePath("/dashboard/coupons")
        return { success: true, data: discount }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to update coupon" }
    }
}

export async function deleteDiscount(id: string): Promise<ActionResult> {
    try {
        await apiClient.delete(`/discounts/${id}`)
        revalidatePath("/dashboard/coupons")
        return { success: true }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to delete coupon" }
    }
}
