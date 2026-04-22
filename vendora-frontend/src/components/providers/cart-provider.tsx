"use client"

import { createContext, useContext, useEffect, useState, ReactNode } from "react"
import { CartItem, CartResponse } from "@/types"
import { browserApiClient, BrowserApiError } from "@/lib/browser-api-client"
import { useAuth } from "@/components/providers/auth-provider"
import { toast } from "sonner"

interface CartContextType {
    items: CartItem[]
    totalItems: number
    totalAmount: number
    minOrderAmount: number
    isLoading: boolean
    isInitializing: boolean
    addItem: (productId: string, quantity: number, variantId?: string) => Promise<void>
    removeItem: (itemId: string) => Promise<void>
    updateQuantity: (itemId: string, newQuantity: number) => Promise<void>
    clearCart: () => Promise<void>
    resetCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [cart, setCart] = useState<CartResponse | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isInitializing, setIsInitializing] = useState(false)

    useEffect(() => {
        if (!user) {
            setCart(null)
            return
        }
        setIsInitializing(true)
        browserApiClient
            .get<CartResponse>("/cart")
            .then(setCart)
            .catch(() => {})
            .finally(() => setIsInitializing(false))
    }, [user])

    const addItem = async (productId: string, quantity: number, variantId?: string) => {
        setIsLoading(true)
        try {
            const body: Record<string, unknown> = { product_id: productId, quantity }
            if (variantId) body.variant_id = variantId
            const data = await browserApiClient.post<CartResponse>("/cart/items", body)
            setCart(data)
        } catch (err) {
            toast.error(err instanceof BrowserApiError ? err.message : "Failed to update cart")
        } finally {
            setIsLoading(false)
        }
    }

    const removeItem = async (itemId: string) => {
        setIsLoading(true)
        try {
            await browserApiClient.delete(`/cart/items/${itemId}`)
            setCart((prev) =>
                prev
                    ? {
                          ...prev,
                          items: prev.items.filter((i) => i.id !== itemId),
                          total_items:
                              prev.total_items -
                              (prev.items.find((i) => i.id === itemId)?.quantity ?? 0),
                          total_amount:
                              prev.total_amount -
                              (prev.items.find((i) => i.id === itemId)?.subtotal ?? 0),
                      }
                    : prev
            )
        } catch (err) {
            toast.error(err instanceof BrowserApiError ? err.message : "Failed to remove item")
        } finally {
            setIsLoading(false)
        }
    }

    const updateQuantity = async (itemId: string, newQuantity: number) => {
        const currentItem = cart?.items.find((i) => i.id === itemId)
        if (!currentItem) return
        const delta = newQuantity - currentItem.quantity
        if (delta === 0) return
        await addItem(currentItem.product_id, delta, currentItem.variant_id ?? undefined)
    }

    const handleClearCart = async () => {
        setIsLoading(true)
        try {
            await browserApiClient.delete("/cart")
            setCart({ items: [], total_items: 0, total_amount: 0, min_order_amount: 0 })
        } catch (err) {
            toast.error(err instanceof BrowserApiError ? err.message : "Failed to clear cart")
        } finally {
            setIsLoading(false)
        }
    }

    const resetCart = () => setCart({ items: [], total_items: 0, total_amount: 0, min_order_amount: 0 })

    return (
        <CartContext.Provider
            value={{
                items: cart?.items ?? [],
                totalItems: cart?.total_items ?? 0,
                totalAmount: cart?.total_amount ?? 0,
                minOrderAmount: cart?.min_order_amount ?? 0,
                isLoading,
                isInitializing,
                addItem,
                removeItem,
                updateQuantity,
                clearCart: handleClearCart,
                resetCart,
            }}
        >
            {children}
        </CartContext.Provider>
    )
}

export function useCart() {
    const context = useContext(CartContext)
    if (context === undefined) {
        throw new Error("useCart must be used within a CartProvider")
    }
    return context
}
