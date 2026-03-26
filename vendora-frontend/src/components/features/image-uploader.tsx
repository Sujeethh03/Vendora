"use client"

import { useRef, useState } from "react"
import { toast } from "sonner"
import { Loader2, Star, Trash2, ImagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ProductImage } from "@/types"
import { uploadProductImage, deleteProductImage, setPrimaryImage } from "@/actions/product-actions"

const MAX_IMAGES = 5
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

interface ImageUploaderProps {
    productId: string
    initialImages: ProductImage[]
    onImagesChange?: (images: ProductImage[]) => void
}

export function ImageUploader({ productId, initialImages, onImagesChange }: ImageUploaderProps) {
    const [images, setImages] = useState<ProductImage[]>(initialImages)

    function updateImages(updater: (prev: ProductImage[]) => ProductImage[]) {
        const next = updater(images)
        setImages(next)
        onImagesChange?.(next)
    }
    const [uploading, setUploading] = useState(false)
    const [loadingImageId, setLoadingImageId] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)

    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const files = Array.from(e.target.files || [])
        if (!files.length) return

        const remaining = MAX_IMAGES - images.length
        const toUpload = files.slice(0, remaining)

        if (files.length > remaining) {
            toast.warning(`Only ${remaining} more image(s) can be added (max ${MAX_IMAGES})`)
        }

        setUploading(true)
        for (const file of toUpload) {
            const formData = new FormData()
            formData.append("file", file)
            const result = await uploadProductImage(productId, formData)
            if (result.success && result.data) {
                updateImages((prev) => [...prev, result.data!])
            } else {
                toast.error(result.error || "Failed to upload image")
            }
        }
        setUploading(false)
        // Reset input so the same file can be re-selected if needed
        if (fileInputRef.current) fileInputRef.current.value = ""
    }

    async function handleDelete(imageId: string) {
        setLoadingImageId(imageId)
        const result = await deleteProductImage(productId, imageId)
        if (result.success) {
            updateImages((prev) => {
                const remaining = prev.filter((img) => img.id !== imageId)
                const deletedWasPrimary = prev.find((img) => img.id === imageId)?.is_primary
                if (deletedWasPrimary && remaining.length > 0) {
                    return remaining.map((img, i) => ({ ...img, is_primary: i === 0 }))
                }
                return remaining
            })
        } else {
            toast.error(result.error || "Failed to delete image")
        }
        setLoadingImageId(null)
    }

    async function handleSetPrimary(imageId: string) {
        setLoadingImageId(imageId)
        const result = await setPrimaryImage(productId, imageId)
        if (result.success) {
            updateImages((prev) =>
                prev.map((img) => ({ ...img, is_primary: img.id === imageId }))
            )
        } else {
            toast.error(result.error || "Failed to set primary image")
        }
        setLoadingImageId(null)
    }

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                    {images.length}/{MAX_IMAGES} images
                </p>
                {images.length < MAX_IMAGES && (
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={uploading}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {uploading ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <ImagePlus className="mr-2 h-4 w-4" />
                        )}
                        Add Images
                    </Button>
                )}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileChange}
                />
            </div>

            {images.length === 0 ? (
                <div
                    className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                >
                    <ImagePlus className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Click to upload product images</p>
                    <p className="text-xs text-muted-foreground mt-1">JPEG, PNG, WebP — up to {MAX_IMAGES} images</p>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
                    {images.map((image) => (
                        <div key={image.id} className="relative group aspect-square">
                            <img
                                src={`${API_URL}${image.url}`}
                                alt="Product image"
                                className="w-full h-full object-cover rounded-lg border"
                            />
                            {image.is_primary && (
                                <span className="absolute top-1 left-1 bg-yellow-400 text-yellow-900 text-[10px] font-semibold px-1.5 py-0.5 rounded">
                                    Primary
                                </span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-1">
                                {!image.is_primary && (
                                    <button
                                        type="button"
                                        title="Set as primary"
                                        disabled={loadingImageId === image.id}
                                        onClick={() => handleSetPrimary(image.id)}
                                        className="p-1.5 bg-white/20 hover:bg-white/40 rounded text-white transition-colors"
                                    >
                                        {loadingImageId === image.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Star className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                )}
                                <button
                                    type="button"
                                    title="Delete image"
                                    disabled={loadingImageId === image.id}
                                    onClick={() => handleDelete(image.id)}
                                    className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded text-white transition-colors"
                                >
                                    {loadingImageId === image.id ? (
                                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    ) : (
                                        <Trash2 className="h-3.5 w-3.5" />
                                    )}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
