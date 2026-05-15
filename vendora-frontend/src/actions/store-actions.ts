"use server"

import { cache } from "react"
import { apiClient } from "@/lib/api-client"
import { StoreConfig } from "@/types"

export const getStoreConfig = cache(async (): Promise<StoreConfig> => {
    try {
        return await apiClient.get<StoreConfig>("/store/config")
    } catch {
        return {
            store_name: "Vendora",
            announcement_text: null,
            free_delivery_min: 499,
            low_stock_threshold: 5,
            hero_tagline: "Pure. Natural. Straight from the Farm.",
            hero_description: "Shop directly from local farmers. No middlemen, no chemicals — just honest, fresh produce delivered to your door.",
            trust_badges: null,
            promo_banners: null,
            category_images: null,
        }
    }
})

export const getCategories = cache(async (): Promise<string[]> => {
    try {
        return await apiClient.get<string[]>("/products/categories")
    } catch {
        return []
    }
})

export async function updateStoreConfig(data: Partial<StoreConfig>): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.put<StoreConfig>("/store/config", data)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to save settings" }
    }
}

export async function uploadBannerImage(index: number, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.postForm<StoreConfig>(`/store/banners/${index}/image`, formData)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to upload image" }
    }
}

export async function uploadCategoryImage(category: string, formData: FormData): Promise<{ success: boolean; error?: string }> {
    try {
        await apiClient.postForm<StoreConfig>(`/store/categories/${encodeURIComponent(category)}/image`, formData)
        return { success: true }
    } catch (e: any) {
        return { success: false, error: e.message || "Failed to upload image" }
    }
}
