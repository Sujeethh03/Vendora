import Link from "next/link"
import { redirect } from "next/navigation"
import { getMe } from "@/actions/auth-actions"
import { getProducts } from "@/actions/product-actions"
import { ProductsTable } from "@/components/features/products-table"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default async function DashboardPage() {
    const user = await getMe()

    if (!user) {
        redirect("/login")
    }

    const productsData = await getProducts({ seller_id: user.id })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
                    <p className="text-muted-foreground">Manage your products</p>
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
