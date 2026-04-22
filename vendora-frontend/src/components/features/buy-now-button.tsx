"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"

interface BuyNowButtonProps {
    productId: string
    stock: number
    variantId?: string
}

export function BuyNowButton({ productId, stock, variantId }: BuyNowButtonProps) {
    const { user } = useAuth()
    const { addItem } = useCart()
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    const handleClick = async () => {
        if (!user) {
            router.push(`/login?redirect=/products/${productId}`)
            return
        }
        setLoading(true)
        await addItem(productId, 1, variantId)
        router.push("/checkout")
    }

    return (
        <Button
            size="lg"
            className="w-full gap-2"
            disabled={stock === 0 || loading}
            onClick={handleClick}
        >
            <Zap className="h-4 w-4" />
            {loading ? "Please wait…" : "Buy Now"}
        </Button>
    )
}
