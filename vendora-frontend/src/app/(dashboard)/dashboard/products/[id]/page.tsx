import { notFound } from "next/navigation"
import { getProduct } from "@/actions/product-actions"
import { EditProductForm } from "./edit-product-form"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"

interface EditProductPageProps {
    params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const { id } = await params
    const product = await getProduct(id)

    if (!product) {
        notFound()
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Edit Product</h1>
                    <p className="text-muted-foreground">Update your product details</p>
                </div>
            </div>

            <EditProductForm product={product} />
        </div>
    )
}
