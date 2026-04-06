import Link from "next/link"
import { getProducts } from "@/actions/product-actions"
import { ProductsTable } from "@/components/features/products-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function DashboardPage() {
    const productsData = await getProducts()

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Products</h1>
                    <p className="text-muted-foreground">Manage your store products</p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/products/new">
                        <Plus className="h-4 w-4 mr-2" />
                        Add Product
                    </Link>
                </Button>
            </div>

            <ProductsTable products={productsData.items} />
        </div>
    )
}
