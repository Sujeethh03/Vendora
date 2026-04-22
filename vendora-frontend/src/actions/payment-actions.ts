"use server"

import { apiClient } from "@/lib/api-client"
import { CheckoutSession, ActionResult } from "@/types"

interface VerifyPaymentData {
    order_id: string
    razorpay_order_id: string
    razorpay_payment_id: string
    razorpay_signature: string
}

export async function verifyPayment(
    data: VerifyPaymentData
): Promise<ActionResult<{ order_id: string }>> {
    try {
        const result = await apiClient.post<{ order_id: string }>("/payments/verify", data)
        return { success: true, data: result }
    } catch (error: any) {
        return { success: false, error: error.message || "Payment verification failed" }
    }
}

export async function retryPayment(orderId: string): Promise<ActionResult<CheckoutSession>> {
    try {
        const session = await apiClient.post<CheckoutSession>(`/payments/retry/${orderId}`, {})
        return { success: true, data: session }
    } catch (error: any) {
        return { success: false, error: error.message || "Failed to retry payment" }
    }
}
