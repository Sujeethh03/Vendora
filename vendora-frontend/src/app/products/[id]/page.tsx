import { notFound } from "next/navigation"
import { getProduct } from "@/actions/product-actions"
import { Navbar } from "@/components/features/navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { ProductGallery } from "./product-gallery"
import { ShoppingCart, Zap, Package, CheckCircle2, XCircle, AlertCircle } from "lucide-react"

interface ProductPageProps {
    params: Promise<{ id: string }>
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price)

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

export default async function ProductPage({ params }: ProductPageProps) {
    const { id } = await params
    const product = await getProduct(id)

    if (!product) notFound()

    const listedDate = new Date(product.created_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
    })

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

                        {/* Price */}
                        <div>
                            <p className="text-sm text-muted-foreground">Price</p>
                            <p className="text-4xl font-bold text-primary mt-1">
                                {formatPrice(product.price)}
                            </p>
                        </div>

                        {/* Stock */}
                        <StockBadge stock={product.stock} />

                        <Separator />

                        {/* Actions */}
                        <div className="flex flex-col gap-3">
                            <Button size="lg" className="w-full gap-2" disabled={product.stock === 0}>
                                <Zap className="h-4 w-4" />
                                Buy Now
                            </Button>
                            <Button
                                size="lg"
                                variant="outline"
                                className="w-full gap-2"
                                disabled={product.stock === 0}
                            >
                                <ShoppingCart className="h-4 w-4" />
                                Add to Cart
                            </Button>
                        </div>

                        <Separator />

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
                                <span className="font-medium">{product.stock} units</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
