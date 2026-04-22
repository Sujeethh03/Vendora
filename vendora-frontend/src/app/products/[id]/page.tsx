import { notFound } from "next/navigation"
import { getProduct } from "@/actions/product-actions"
import { Navbar } from "@/components/features/navbar"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ProductGallery } from "./product-gallery"
import { ProductActions } from "./product-actions"
import { Package } from "lucide-react"
import { formatDate } from "@/lib/format"

interface ProductPageProps {
    params: Promise<{ id: string }>
}

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params
    const product = await getProduct(id)

    if (!product) notFound()

    const listedDate = formatDate(product.created_at)
    const totalStock = product.variants.length > 0
        ? product.variants.reduce((sum, v) => sum + v.stock, 0)
        : product.stock

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-8 max-w-6xl">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                    {/* Left — Image Gallery */}
                    <ProductGallery images={product.images} productName={product.name} />

                    {/* Right — Product Info */}
                    <div className="flex flex-col gap-4">
                        {/* Name & Category */}
                        <div>
                            {product.category && (
                                <Badge variant="secondary" className="mb-2">
                                    {product.category}
                                </Badge>
                            )}
                            <h1 className="text-2xl font-bold leading-snug">{product.name}</h1>
                        </div>

                        <Separator />

                        {/* Price, Variants, Stock, Actions — client component */}
                        <ProductActions product={product} />

                        {/* Description */}
                        {product.description && (
                            <div>
                                <h2 className="font-semibold mb-2">About this product</h2>
                                <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-line">
                                    {product.description}
                                </p>
                            </div>
                        )}

                        {/* Meta */}
                        <div className="rounded-lg border bg-muted/40 p-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Sold by</span>
                                <span className="font-medium flex items-center gap-1">
                                    <Package className="h-3.5 w-3.5" />
                                    {product.seller_name ?? "Vendora Seller"}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Listed on</span>
                                <span className="font-medium">{listedDate}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Stock available</span>
                                <span className="font-medium">{totalStock} units</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
