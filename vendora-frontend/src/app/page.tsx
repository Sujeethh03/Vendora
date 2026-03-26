import { Suspense } from "react"
import { getProducts } from "@/actions/product-actions"
import { Navbar } from "@/components/features/navbar"
import { ProductCard } from "@/components/features/product-card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Search, ChevronLeft, ChevronRight } from "lucide-react"

interface HomePageProps {
    searchParams: Promise<{
        search?: string
        category?: string
        min_price?: string
        max_price?: string
        page?: string
    }>
}

function ProductGridSkeleton() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="space-y-3">
                    <Skeleton className="aspect-square w-full rounded-lg" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-1/4" />
                </div>
            ))}
        </div>
    )
}

async function ProductGrid({ searchParams }: { searchParams: Awaited<HomePageProps["searchParams"]> }) {
    const page = Number(searchParams.page) || 1
    const productsData = await getProducts({
        search: searchParams.search,
        category: searchParams.category,
        min_price: searchParams.min_price,
        max_price: searchParams.max_price,
        page: String(page),
        page_size: "20",
    })

    const { items, total, page: currentPage, page_size } = productsData
    const totalPages = Math.ceil(total / page_size)

    return (
        <div className="space-y-6">
            <p className="text-sm text-muted-foreground">
                Showing {items.length} of {total} products
            </p>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
                    <p className="text-lg font-medium">No products found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}

            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 pt-4">
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage <= 1}
                        asChild={currentPage > 1}
                    >
                        {currentPage > 1 ? (
                            <Link
                                href={{
                                    query: {
                                        ...searchParams,
                                        page: String(currentPage - 1),
                                    },
                                }}
                            >
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </Link>
                        ) : (
                            <span>
                                <ChevronLeft className="h-4 w-4 mr-1" />
                                Previous
                            </span>
                        )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage >= totalPages}
                        asChild={currentPage < totalPages}
                    >
                        {currentPage < totalPages ? (
                            <Link
                                href={{
                                    query: {
                                        ...searchParams,
                                        page: String(currentPage + 1),
                                    },
                                }}
                            >
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </Link>
                        ) : (
                            <span>
                                Next
                                <ChevronRight className="h-4 w-4 ml-1" />
                            </span>
                        )}
                    </Button>
                </div>
            )}
        </div>
    )
}

export default async function MarketplacePage({ searchParams }: HomePageProps) {
    const resolvedSearchParams = await searchParams

    return (
        <div className="min-h-screen bg-background">
            <Navbar />

            <main className="container py-8 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold">Marketplace</h1>
                    <p className="text-muted-foreground mt-1">Browse products from sellers</p>
                </div>

                {/* Search & Filter Bar */}
                <form method="GET" className="flex flex-wrap gap-3 items-end">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            name="search"
                            placeholder="Search products..."
                            defaultValue={resolvedSearchParams.search}
                            className="pl-9"
                        />
                    </div>
                    <div className="min-w-[150px]">
                        <Input
                            name="category"
                            placeholder="Category"
                            defaultValue={resolvedSearchParams.category}
                        />
                    </div>
                    <div className="min-w-[120px]">
                        <Input
                            name="min_price"
                            type="number"
                            placeholder="Min price"
                            defaultValue={resolvedSearchParams.min_price}
                        />
                    </div>
                    <div className="min-w-[120px]">
                        <Input
                            name="max_price"
                            type="number"
                            placeholder="Max price"
                            defaultValue={resolvedSearchParams.max_price}
                        />
                    </div>
                    <Button type="submit">Search</Button>
                    {(resolvedSearchParams.search || resolvedSearchParams.category || resolvedSearchParams.min_price || resolvedSearchParams.max_price) && (
                        <Button variant="outline" asChild>
                            <Link href="/">Clear</Link>
                        </Button>
                    )}
                </form>

                {/* Products Grid */}
                <Suspense fallback={<ProductGridSkeleton />}>
                    <ProductGrid searchParams={resolvedSearchParams} />
                </Suspense>
            </main>
        </div>
    )
}
