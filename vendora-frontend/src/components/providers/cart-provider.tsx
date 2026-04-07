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
    isLoading: boolean
    isInitializing: boolean
    addItem: (productId: string, quantity: number) => Promise<void>
    removeItem: (productId: string) => Promise<void>
    updateQuantity: (productId: string, newQuantity: number) => Promise<void>
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

    const addItem = async (productId: string, quantity: number) => {
        setIsLoading(true)
        try {
            const data = await browserApiClient.post<CartResponse>("/cart/items", {
                product_id: productId,
                quantity,
            })
            setCart(data)
        } catch (err) {
            toast.error(err instanceof BrowserApiError ? err.message : "Failed to update cart")
        } finally {
            setIsLoading(false)
        }
    }

    const removeItem = async (productId: string) => {
        setIsLoading(true)
        try {
            await browserApiClient.delete(`/cart/items/${productId}`)
            setCart((prev) =>
                prev
                    ? {
                          ...prev,
                          items: prev.items.filter((i) => i.product_id !== productId),
                          total_items:
                              prev.total_items -
                              (prev.items.find((i) => i.product_id === productId)?.quantity ?? 0),
                          total_amount:
                              prev.total_amount -
                              (prev.items.find((i) => i.product_id === productId)?.subtotal ?? 0),
                      }
                    : prev
            )
        } catch (err) {
            toast.error(err instanceof BrowserApiError ? err.message : "Failed to remove item")
        } finally {
            setIsLoading(false)
        }
    }

    const updateQuantity = async (productId: string, newQuantity: number) => {
        const currentItem = cart?.items.find((i) => i.product_id === productId)
        if (!currentItem) return
        const delta = newQuantity - currentItem.quantity
        if (delta === 0) return
        await addItem(productId, delta)
    }

    const handleClearCart = async () => {
        setIsLoading(true)
        try {
            await browserApiClient.delete("/cart")
            setCart({ items: [], total_items: 0, total_amount: 0 })
        } catch (err) {
            toast.error(err instanceof BrowserApiError ? err.message : "Failed to clear cart")
        } finally {
            setIsLoading(false)
        }
    }

    const resetCart = () => setCart({ items: [], total_items: 0, total_amount: 0 })

    return (
        <CartContext.Provider
            value={{
                items: cart?.items ?? [],
                totalItems: cart?.total_items ?? 0,
                totalAmount: cart?.total_amount ?? 0,
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
