import Link from "next/link"
import { getProducts } from "@/actions/product-actions"
import { ProductsTable } from "@/components/features/products-table"
import { Button } from "@/components/ui/button"
import { Plus, ChevronLeft, ChevronRight } from "lucide-react"

const PAGE_SIZE = 10

interface DashboardPageProps {
    searchParams: Promise<{ page?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
    const { page: pageParam } = await searchParams
    const page = Math.max(1, Number(pageParam) || 1)

    const productsData = await getProducts({ page: String(page), page_size: String(PAGE_SIZE) })
    const totalPages = Math.ceil(productsData.total / PAGE_SIZE)

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

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page <= 1}
                        asChild={page > 1}
                    >
                        {page > 1 ? (
                            <Link href={{ query: { page: String(page - 1) } }}>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Link>
                        ) : (
                            <span><ChevronLeft className="h-4 w-4 mr-1" />Previous</span>
                        )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={page >= totalPages}
                        asChild={page < totalPages}
                    >
                        {page < totalPages ? (
                            <Link href={{ query: { page: String(page + 1) } }}>
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                        ) : (
                            <span>Next<ChevronRight className="h-4 w-4 ml-1" /></span>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}
