"use client"

import { useState, useRef } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { ChevronDown, ChevronUp, Plus, Pencil, Trash2, ImageOff, Camera, Loader2 } from "lucide-react"
import { Product } from "@/types"
import { deleteProduct } from "@/actions/product-actions"
import { uploadCategoryImage } from "@/actions/store-actions"
import { Button } from "@/components/ui/button"
import { ConfirmDeleteDialog } from "@/components/features/confirm-delete-dialog"
import { formatPrice } from "@/lib/format"
import { config } from "@/lib/config"

const API_URL = config.api.publicBaseUrl

interface CategorySectionProps {
    category: string | null
    products: Product[]
    imageUrl?: string | null
}

export function CategorySection({ category, products: initialProducts, imageUrl }: CategorySectionProps) {
    const router = useRouter()
    const [expanded, setExpanded] = useState(true)
    const [products, setProducts] = useState(initialProducts)
    const [deletingId, setDeletingId] = useState<string | null>(null)
    const [uploading, setUploading] = useState(false)
    const [currentImageUrl, setCurrentImageUrl] = useState(imageUrl ?? null)
    const fileRef = useRef<HTMLInputElement>(null)

    const displayName = category ?? "Uncategorized"
    const addHref = category
        ? `/dashboard/products/new?category=${encodeURIComponent(category)}`
        : "/dashboard/products/new"

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        if (!category) return
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const fd = new FormData()
        fd.append("file", file)
        const result = await uploadCategoryImage(category, fd)
        if (result.success) {
            toast.success("Thumbnail updated")
            // show preview immediately without waiting for refresh
            setCurrentImageUrl(URL.createObjectURL(file))
            router.refresh()
        } else {
            toast.error(result.error || "Upload failed")
        }
        setUploading(false)
        if (fileRef.current) fileRef.current.value = ""
    }

    async function handleDelete(id: string) {
        setDeletingId(id)
        const result = await deleteProduct(id)
        if (result.success) {
            toast.success("Product deleted")
            setProducts((prev) => prev.filter((p) => p.id !== id))
            router.refresh()
        } else {
            toast.error(result.error || "Failed to delete")
        }
        setDeletingId(null)
    }

    if (products.length === 0) return null

    return (
        <div className="rounded-2xl overflow-hidden border">
            {/* Category header — full-width banner card style */}
            <div
                className="relative h-24 cursor-pointer select-none overflow-hidden"
                onClick={() => setExpanded((e) => !e)}
            >
                {/* Background: uploaded image or green gradient */}
                {currentImageUrl && category ? (
                    <img
                        src={currentImageUrl.startsWith("blob:") ? currentImageUrl : `${API_URL}${currentImageUrl}`}
                        alt={displayName}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                ) : (
                    <div
                        className="absolute inset-0"
                        style={{
                            background: category
                                ? "linear-gradient(135deg, #2D6A4F, #40916c)"
                                : "linear-gradient(135deg, #6b7280, #9ca3af)",
                        }}
                    >
                        <span className="absolute right-6 top-1/2 -translate-y-1/2 text-7xl opacity-10 select-none font-black">
                            {displayName.charAt(0).toUpperCase()}
                        </span>
                    </div>
                )}

                {/* Dark gradient overlay — bottom to top, same as banner cards */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-black/10" />

                {/* Bottom content row */}
                <div className="relative h-full flex items-end justify-between px-4 pb-3">
                    {/* Left: name + count */}
                    <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-base capitalize drop-shadow-sm">
                            {displayName}
                        </span>
                        <span className="text-[11px] font-semibold bg-white/25 text-white px-2 py-0.5 rounded-full">
                            {products.length}
                        </span>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {category && (
                            <button
                                onClick={() => fileRef.current?.click()}
                                className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/20 hover:bg-white/35 text-white text-[11px] font-semibold transition-colors"
                            >
                                {uploading
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <Camera className="h-3 w-3" />
                                }
                                {currentImageUrl ? "Change" : "Add photo"}
                            </button>
                        )}
                        <Link
                            href={addHref}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-full bg-white/20 hover:bg-white/35 text-white text-[11px] font-semibold transition-colors"
                        >
                            <Plus className="h-3 w-3" />
                            Add product
                        </Link>
                        {expanded
                            ? <ChevronUp className="h-4 w-4 text-white/80" />
                            : <ChevronDown className="h-4 w-4 text-white/80" />
                        }
                    </div>
                </div>
            </div>

            <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
            />

            {/* Product rows */}
            {expanded && (
                <div className="divide-y">
                    {products.map((product) => {
                        const primaryImage = product.images?.find((i) => i.is_primary) ?? product.images?.[0]
                        const totalStock = product.variants.length > 0
                            ? product.variants.reduce((s, v) => s + v.stock, 0)
                            : product.stock

                        return (
                            <div key={product.id} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/20 transition-colors">
                                {/* Thumbnail */}
                                <div className="h-12 w-12 rounded-lg border bg-muted shrink-0 overflow-hidden flex items-center justify-center">
                                    {primaryImage ? (
                                        <img
                                            src={`${API_URL}${primaryImage.url}`}
                                            alt={product.name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                                    )}
                                </div>

                                {/* Name + stock */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{product.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {totalStock === 0
                                            ? <span className="text-destructive">Out of stock</span>
                                            : `${totalStock} in stock`
                                        }
                                    </p>
                                </div>

                                {/* Price */}
                                <span className="text-sm font-semibold shrink-0">{formatPrice(product.price)}</span>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                                        <Link href={`/dashboard/products/${product.id}`}>
                                            <Pencil className="h-3.5 w-3.5" />
                                            <span className="sr-only">Edit</span>
                                        </Link>
                                    </Button>
                                    <ConfirmDeleteDialog onConfirm={() => handleDelete(product.id)}>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                            disabled={deletingId === product.id}
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </ConfirmDeleteDialog>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
