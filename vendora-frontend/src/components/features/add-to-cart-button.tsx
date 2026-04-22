"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { toast } from "sonner"


interface AddToCartButtonProps {
    productId: string
    stock: number
    variantId?: string
    className?: string
}

export function AddToCartButton({ productId, stock, variantId, className }: AddToCartButtonProps) {
    const { user } = useAuth()
    const { addItem, isLoading } = useCart()
    const router = useRouter()
    const [adding, setAdding] = useState(false)

    const handleClick = async () => {
        if (!user) {
            router.push(`/login?redirect=/products/${productId}`)
            return
        }
        setAdding(true)
        await addItem(productId, 1, variantId)
        toast.success("Added to cart")
        setAdding(false)
    }

    return (
        <Button
            size="lg"
            variant="outline"
            className={`w-full gap-2 ${className ?? ""}`}
            disabled={stock === 0 || adding || isLoading}
            onClick={handleClick}
        >
            <ShoppingCart className="h-4 w-4" />
            {adding ? "Adding..." : "Add to Cart"}
        </Button>
    )
}
