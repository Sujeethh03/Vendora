"use client"

import { useState } from "react"
import Link from "next/link"
import { Package, Leaf, ShoppingCart, Loader2 } from "lucide-react"
import { Product } from "@/types"
import { config } from "@/lib/config"
import { formatPrice } from "@/lib/format"
import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"

const API_URL = config.api.publicBaseUrl

interface ProductCardProps {
    product: Product
    lowStockThreshold?: number
}

export function ProductCard({ product, lowStockThreshold = 5 }: ProductCardProps) {
    const { user } = useAuth()
    const { addItem, openCart } = useCart()
    const [adding, setAdding] = useState(false)

    const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]
    const hasVariants = product.variants && product.variants.length > 0
    const isOutOfStock = hasVariants
        ? product.variants.every((v) => v.stock === 0)
        : product.stock === 0
    const isLowStock = !hasVariants && product.stock > 0 && product.stock <= lowStockThreshold

    async function handleAddToCart(e: React.MouseEvent) {
        e.preventDefault()
        e.stopPropagation()
        setAdding(true)
        try {
            await addItem(product.id, 1)
            openCart()
        } finally {
            setAdding(false)
        }
    }

    return (
        <Link href={`/products/${product.id}`}>
            <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-[#2D6A4F]/30 hover:shadow-lg transition-all duration-300 cursor-pointer">
                {/* Image area */}
                <div className="relative aspect-square bg-[#f5f5f0] overflow-hidden">
                    {primaryImage ? (
                        <img
                            src={`${API_URL}${primaryImage.url}`}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-16 w-16 text-gray-300" />
                        </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {isOutOfStock && (
                            <span className="bg-gray-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                SOLD OUT
                            </span>
                        )}
                        {isLowStock && (
                            <span className="bg-[#F4845F] text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                LOW STOCK
                            </span>
                        )}
                        {product.category && (
                            <span className="bg-[#2D6A4F] text-white text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize">
                                {product.category}
                            </span>
                        )}
                    </div>

                    {/* Farm fresh indicator */}
                    <div className="absolute top-2 right-2">
                        <div className="bg-white/90 backdrop-blur-sm rounded-full p-1" title="Farm Fresh">
                            <Leaf className="h-3.5 w-3.5 text-[#2D6A4F]" />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-3.5">
                    <h3 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2 mb-1 group-hover:text-[#2D6A4F] transition-colors">
                        {product.name}
                    </h3>

                    {product.seller_name && (
                        <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                            <Leaf className="h-3 w-3 text-[#2D6A4F]" />
                            {product.seller_name}
                        </p>
                    )}

                    <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-[#2D6A4F] text-base">
                            {formatPrice(product.price)}
                        </span>
                        {!isOutOfStock && !hasVariants && (
                            <span className="text-[10px] text-gray-400 font-medium">
                                {product.stock} left
                            </span>
                        )}
                    </div>

                    {/* Bottom action strip */}
                    <div className="mt-3 pt-3 border-t border-gray-100">
                        {isOutOfStock ? (
                            <div className="w-full text-center text-xs font-semibold py-1.5 rounded-full bg-gray-100 text-gray-400">
                                Out of Stock
                            </div>
                        ) : user?.is_admin ? (
                            <div className="w-full text-center text-xs font-semibold py-1.5 rounded-full bg-green-50 text-[#2D6A4F] group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors">
                                View Product →
                            </div>
                        ) : hasVariants ? (
                            <div className="w-full text-center text-xs font-semibold py-1.5 rounded-full bg-green-50 text-[#2D6A4F] group-hover:bg-[#2D6A4F] group-hover:text-white transition-colors">
                                Select Options →
                            </div>
                        ) : (
                            <div className="flex gap-2">
                                <button
                                    onClick={handleAddToCart}
                                    disabled={adding}
                                    className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-1.5 rounded-full bg-[#2D6A4F] text-white hover:bg-[#1B4332] disabled:opacity-60 transition-colors"
                                >
                                    {adding
                                        ? <Loader2 className="h-3 w-3 animate-spin" />
                                        : <ShoppingCart className="h-3 w-3" />
                                    }
                                    {adding ? "Adding…" : "Add to Cart"}
                                </button>
                                <div className="flex items-center justify-center text-xs font-semibold px-3 py-1.5 rounded-full bg-green-50 text-[#2D6A4F] hover:bg-green-100 transition-colors whitespace-nowrap">
                                    View →
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    )
}
