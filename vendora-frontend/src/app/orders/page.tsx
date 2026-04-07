import Link from "next/link"
import { Package } from "lucide-react"
import { Navbar } from "@/components/features/navbar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getOrders } from "@/actions/order-actions"
import { formatPrice, formatDate } from "@/lib/format"

export default async function OrdersPage({
    searchParams,
}: {
    searchParams: Promise<{ page?: string }>
}) {
    const { page: pageParam } = await searchParams
    const page = Math.max(1, parseInt(pageParam ?? "1", 10))
    const data = await getOrders(page)

    if (!data || data.items.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-16 flex flex-col items-center gap-4 text-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <h1 className="text-2xl font-bold">No orders yet</h1>
                    <p className="text-muted-foreground">Your order history will appear here</p>
                    <Button asChild>
                        <Link href="/">Browse Products</Link>
                    </Button>
                </main>
            </div>
        )
    }

    const totalPages = Math.ceil(data.total / data.page_size)

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 max-w-3xl">
                <h1 className="text-2xl font-bold mb-6">Your Orders</h1>

                <div className="rounded-lg border divide-y">
                    {data.items.map((order) => (
                        <div key={order.id} className="p-4 flex items-center gap-4">
                            <div className="flex-1 min-w-0 space-y-0.5">
                                <p className="text-sm font-medium">
                                    Order #{order.id.slice(0, 8).toUpperCase()}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {formatDate(order.created_at)} &bull;{" "}
                                    {order.item_count} {order.item_count === 1 ? "item" : "items"}
                                </p>
                            </div>
                            <Badge variant="outline" className="capitalize shrink-0">
                                {order.status}
                            </Badge>
                            <p className="font-semibold shrink-0 text-sm">
                                {formatPrice(order.total_amount)}
                            </p>
                            <Button asChild variant="outline" size="sm" className="shrink-0">
                                <Link href={`/orders/${order.id}`}>View</Link>
                            </Button>
                        </div>
                    ))}
                </div>

                {totalPages > 1 && (
                    <div className="mt-6 flex justify-center gap-2">
                        {page > 1 && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/orders?page=${page - 1}`}>Previous</Link>
                            </Button>
                        )}
                        <span className="text-sm text-muted-foreground self-center">
                            Page {page} of {totalPages}
                        </span>
                        {page < totalPages && (
                            <Button asChild variant="outline" size="sm">
                                <Link href={`/orders?page=${page + 1}`}>Next</Link>
                            </Button>
                        )}
                    </div>
                )}
            </main>
        </div>
    )
}
