"use client"

import { useState } from "react"
import { Separator } from "@/components/ui/separator"
import { AddToCartButton } from "@/components/features/add-to-cart-button"
import { BuyNowButton } from "@/components/features/buy-now-button"
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react"
import { formatPrice } from "@/lib/format"
import type { Product } from "@/types"

function StockBadge({ stock }: { stock: number }) {
    if (stock === 0)
        return (
            <span className="flex items-center gap-1.5 text-destructive font-medium">
                <XCircle className="h-4 w-4" /> Out of Stock
            </span>
        )
    if (stock <= 5)
        return (
            <span className="flex items-center gap-1.5 text-orange-500 font-medium">
                <AlertCircle className="h-4 w-4" /> Only {stock} left in stock
            </span>
        )
    return (
        <span className="flex items-center gap-1.5 text-green-600 font-medium">
            <CheckCircle2 className="h-4 w-4" /> In Stock
        </span>
    )
}

export function ProductActions({ product }: { product: Product }) {
    const hasVariants = product.variants.length > 0
    const [selectedVariantId, setSelectedVariantId] = useState<string | undefined>(undefined)

    const selectedVariant = hasVariants
        ? product.variants.find((v) => v.id === selectedVariantId)
        : undefined

    const displayPrice = selectedVariant ? selectedVariant.price : product.price
    const displayStock = selectedVariant ? selectedVariant.stock : product.stock
    const canAdd = !hasVariants || !!selectedVariantId

    return (
        <>
            {/* Price */}
            <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-4xl font-bold text-primary mt-1">
                    {formatPrice(displayPrice)}
                </p>
                {hasVariants && !selectedVariantId && (
                    <p className="text-xs text-muted-foreground mt-1">Select a variant to see price</p>
                )}
            </div>

            {/* Variant Selector */}
            {hasVariants && (
                <div>
                    <p className="text-sm font-medium mb-2">Select Option</p>
                    <div className="flex flex-wrap gap-2">
                        {product.variants.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setSelectedVariantId(v.id === selectedVariantId ? undefined : v.id)}
                                disabled={v.stock === 0}
                                className={[
                                    "px-3 py-1.5 rounded-md border text-sm font-medium transition-colors",
                                    v.stock === 0
                                        ? "opacity-40 cursor-not-allowed border-muted text-muted-foreground"
                                        : selectedVariantId === v.id
                                        ? "border-primary bg-primary text-primary-foreground"
                                        : "border-input bg-background hover:border-primary hover:text-primary",
                                ].join(" ")}
                            >
                                {v.label}
                                {v.stock === 0 && " (Out of stock)"}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Stock */}
            <StockBadge stock={displayStock} />

            <Separator />

            {/* Actions */}
            <div className="flex flex-col gap-3">
                {hasVariants && !selectedVariantId ? (
                    <p className="text-sm text-muted-foreground text-center py-2">
                        Please select an option above
                    </p>
                ) : (
                    <>
                        <BuyNowButton
                            productId={product.id}
                            stock={displayStock}
                            variantId={selectedVariantId}
                        />
                        <AddToCartButton
                            productId={product.id}
                            stock={displayStock}
                            variantId={selectedVariantId}
                        />
                    </>
                )}
            </div>
        </>
    )
}
