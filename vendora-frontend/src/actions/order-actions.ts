"use server"

import { apiClient } from "@/lib/api-client"
import { Order, OrderListResponse, DeliveryAddress, ActionResult } from "@/types"

export async function placeOrder(
    deliveryAddress: DeliveryAddress
): Promise<ActionResult<Order>> {
    try {
        const order = await apiClient.post<Order>("/orders", { delivery_address: deliveryAddress })
        return { success: true, data: order }
    } catch (error: any) {
        console.error("Failed to place order:", error)
        return { success: false, error: error.message || "Failed to place order" }
    }
}

const ORDERS_PAGE_SIZE = 10

export async function getOrders(page = 1): Promise<OrderListResponse | null> {
    try {
        return await apiClient.get<OrderListResponse>("/orders", {
            params: { page: String(page), page_size: String(ORDERS_PAGE_SIZE) },
        })
    } catch (error: any) {
        console.error("Failed to fetch orders:", error)
        return null
    }
}

export async function getOrder(id: string): Promise<Order | null> {
    try {
        return await apiClient.get<Order>(`/orders/${id}`)
    } catch (error: any) {
        console.error("Failed to fetch order:", error)
        return null
    }
}
