"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { browserApiClient } from "@/lib/browser-api-client"
import { Product } from "@/types"
import { ProductCard } from "@/components/features/product-card"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { config as appConfig } from "@/lib/config"

const API_URL = appConfig.api.publicBaseUrl

const CATEGORY_CONFIG: Record<string, { emoji: string; from: string; to: string }> = {
    all:        { emoji: "🛍️", from: "#2D6A4F", to: "#40916c" },
    vegetables: { emoji: "🥦", from: "#16a34a", to: "#86efac" },
    fruits:     { emoji: "🍎", from: "#dc2626", to: "#fca5a5" },
    grains:     { emoji: "🌾", from: "#d97706", to: "#fcd34d" },
    dairy:      { emoji: "🥛", from: "#2563eb", to: "#93c5fd" },
    spices:     { emoji: "🌶️", from: "#ea580c", to: "#fdba74" },
    oils:       { emoji: "🫙", from: "#ca8a04", to: "#fde68a" },
    default:    { emoji: "🛒", from: "#6b7280", to: "#d1d5db" },
}

function getCategoryConfig(cat: string) {
    return CATEGORY_CONFIG[cat.toLowerCase()] ?? CATEGORY_CONFIG.default
}

interface ProductListResponse {
    items: Product[]
    total: number
    page: number
    page_size: number
}

interface CategoryProductBrowserProps {
    categories: string[]
    lowStockThreshold: number
    categoryImages: Record<string, string>
}

export function CategoryProductBrowser({ categories, lowStockThreshold, categoryImages }: CategoryProductBrowserProps) {
    const router = useRouter()
    const searchParams = useSearchParams()
    const urlCategory = searchParams.get("category")

    const [selected, setSelected] = useState<string | null>(urlCategory)
    const [products, setProducts] = useState<Product[]>([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(true)

    const fetchProducts = useCallback(async (category: string | null) => {
        setLoading(true)
        try {
            const params = new URLSearchParams({ page: "1", page_size: "100" })
            if (category) params.set("category", category)
            const data = await browserApiClient.get<ProductListResponse>(`/products?${params}`)
            setProducts(data.items)
            setTotal(data.total)
        } catch {
            setProducts([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        fetchProducts(urlCategory)
        setSelected(urlCategory)
    }, [urlCategory, fetchProducts])

    function handleSelect(cat: string | null) {
        setSelected(cat)
        if (cat) {
            router.replace(`/products?category=${encodeURIComponent(cat)}`, { scroll: false })
        } else {
            router.replace("/products", { scroll: false })
        }
        fetchProducts(cat)
    }

    const allItems: (string | null)[] = [null, ...categories]

    return (
        <div className="flex min-h-[calc(100vh-12rem)]">

            {/* ── LEFT SIDEBAR (desktop) ── */}
            <aside className="hidden md:block w-36 lg:w-44 shrink-0 border-r bg-white">
                <div className="sticky top-40 max-h-[calc(100vh-10rem)] overflow-y-auto p-2 space-y-2 [&::-webkit-scrollbar]:hidden">
                    {allItems.map((cat) => {
                        const key = cat ?? "all"
                        const cfg = getCategoryConfig(key)
                        const isActive = selected === cat
                        const imgUrl = cat ? (categoryImages[cat.toLowerCase()] ?? null) : null

                        return (
                            <button
                                key={key}
                                onClick={() => handleSelect(cat)}
                                className={cn(
                                    "w-full rounded-2xl overflow-hidden relative transition-all duration-200",
                                    isActive
                                        ? "ring-2 ring-[#2D6A4F] ring-offset-2 shadow-lg scale-[1.02]"
                                        : "hover:scale-[1.02] hover:shadow-md"
                                )}
                            >
                                <div className="relative aspect-[4/3] w-full">
                                    {/* Background */}
                                    {imgUrl ? (
                                        <img
                                            src={`${API_URL}${imgUrl}`}
                                            alt={cat ?? "All"}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="absolute inset-0"
                                            style={{ background: `linear-gradient(145deg, ${cfg.from}, ${cfg.to})` }}
                                        >
                                            <span className="absolute right-2 top-1/2 -translate-y-1/2 text-5xl opacity-20 select-none">
                                                {cfg.emoji}
                                            </span>
                                        </div>
                                    )}
                                    {/* Dark shade overlay — bottom to top, like banner cards */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                                    {/* Category name */}
                                    <div className="absolute bottom-0 left-0 right-0 px-2.5 py-2">
                                        <p className="text-white text-[11px] font-bold capitalize leading-tight drop-shadow-sm">
                                            {cat ?? "All"}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </aside>

            {/* ── MOBILE horizontal scroll strip ── */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t shadow-lg">
                <div className="flex gap-2 px-4 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                    {allItems.map((cat) => {
                        const key = cat ?? "all"
                        const cfg = getCategoryConfig(key)
                        const isActive = selected === cat
                        const imgUrl = cat ? (categoryImages[cat.toLowerCase()] ?? null) : null
                        return (
                            <button
                                key={key}
                                onClick={() => handleSelect(cat)}
                                className={cn(
                                    "relative shrink-0 w-16 rounded-xl overflow-hidden transition-all duration-200",
                                    isActive ? "ring-2 ring-[#2D6A4F] ring-offset-1 scale-105" : ""
                                )}
                            >
                                <div className="relative aspect-[3/4] w-full">
                                    {imgUrl ? (
                                        <img
                                            src={`${API_URL}${imgUrl}`}
                                            alt={cat ?? "All"}
                                            className="absolute inset-0 w-full h-full object-cover"
                                        />
                                    ) : (
                                        <div
                                            className="absolute inset-0"
                                            style={{ background: `linear-gradient(145deg, ${cfg.from}, ${cfg.to})` }}
                                        >
                                            <span className="absolute inset-0 flex items-center justify-center text-2xl opacity-30 select-none">
                                                {cfg.emoji}
                                            </span>
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1.5">
                                        <p className="text-white text-[9px] font-bold capitalize leading-tight drop-shadow-sm text-center">
                                            {cat ?? "All"}
                                        </p>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── RIGHT PANEL ── */}
            <main className="flex-1 min-w-0 p-4 md:p-6 pb-24 md:pb-6">
                <div className="mb-5">
                    <h2 className="text-xl font-bold text-gray-900 capitalize">
                        {selected ?? "All Products"}
                    </h2>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${total} product${total !== 1 ? "s" : ""}`}
                    </p>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-32">
                        <Loader2 className="h-9 w-9 animate-spin text-[#2D6A4F]" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 gap-3 text-gray-400">
                        <span className="text-5xl">🌿</span>
                        <p className="text-base font-medium text-gray-600">No products here yet</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                lowStockThreshold={lowStockThreshold}
                            />
                        ))}
                    </div>
                )}
            </main>
        </div>
    )
}
