"use client"

import { useState } from "react"
import { Package } from "lucide-react"
import { ProductImage } from "@/types"
import { config } from "@/lib/config"

const API_URL = config.api.publicBaseUrl

interface ProductGalleryProps {
    images: ProductImage[]
    productName: string
}

export function ProductGallery({ images, productName }: ProductGalleryProps) {
    const primary = images.find((img) => img.is_primary) ?? images[0]
    const [selected, setSelected] = useState<ProductImage | null>(primary ?? null)

    if (images.length === 0) {
        return (
            <div className="aspect-square bg-muted rounded-xl flex items-center justify-center">
                <Package className="h-24 w-24 text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex gap-4">
            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="flex flex-col gap-2">
                    {images.map((img) => (
                        <button
                            key={img.id}
                            onClick={() => setSelected(img)}
                            className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                                selected?.id === img.id
                                    ? "border-primary"
                                    : "border-transparent hover:border-muted-foreground/50"
                            }`}
                        >
                            <img
                                src={`${API_URL}${img.url}`}
                                alt={productName}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Main image */}
            <div className="flex-1 aspect-square rounded-xl overflow-hidden bg-muted">
                <img
                    src={`${API_URL}${selected!.url}`}
                    alt={productName}
                    className="w-full h-full object-contain"
                />
            </div>
        </div>
    )
}
