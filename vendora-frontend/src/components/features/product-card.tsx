import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package } from "lucide-react"
import { Product } from "@/types"
import { config } from "@/lib/config"

const API_URL = config.api.publicBaseUrl

const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price)

interface ProductCardProps {
    product: Product
}

export function ProductCard({ product }: ProductCardProps) {
    const primaryImage = product.images?.find((img) => img.is_primary) ?? product.images?.[0]

    return (
        <Link href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer">
        <Card className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer">
            <div className="bg-muted aspect-square flex items-center justify-center overflow-hidden">
                {primaryImage ? (
                    <img
                        src={`${API_URL}${primaryImage.url}`}
                        alt={product.name}
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <Package className="h-16 w-16 text-muted-foreground" />
                )}
            </div>
            <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm leading-tight line-clamp-2">
                        {product.name}
                    </h3>
                </div>
                {product.category && (
                    <Badge variant="secondary" className="text-xs">
                        {product.category}
                    </Badge>
                )}
                <div className="flex items-center justify-between">
                    <span className="font-bold text-base">{formatPrice(product.price)}</span>
                </div>
                {product.seller_name && (
                    <p className="text-xs text-muted-foreground">by {product.seller_name}</p>
                )}
            </CardContent>
        </Card>
        </Link>
    )
}
