import Link from "next/link"
import { notFound } from "next/navigation"
import { CheckCircle2, Clock, XCircle } from "lucide-react"
import { Navbar } from "@/components/features/navbar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getOrder } from "@/actions/order-actions"
import { formatPrice, formatDate } from "@/lib/format"

function OrderHeader({ status, id, createdAt }: { status: string; id: string; createdAt: string }) {
    if (status === "confirmed") {
        return (
            <div className="bg-green-50 dark:bg-green-950/20 p-6 flex items-center gap-3">
                <CheckCircle2 className="h-8 w-8 text-green-600 shrink-0" />
                <div>
                    <h1 className="text-lg font-semibold">Order Confirmed</h1>
                    <p className="text-sm text-muted-foreground">
                        Order #{id.slice(0, 8).toUpperCase()} &bull; {formatDate(createdAt)}
                    </p>
                </div>
                <Badge variant="outline" className="ml-auto capitalize">Confirmed</Badge>
            </div>
        )
    }
    if (status === "pending_payment") {
        return (
            <div className="bg-yellow-50 dark:bg-yellow-950/20 p-6 flex items-center gap-3">
                <Clock className="h-8 w-8 text-yellow-600 shrink-0" />
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-semibold">Awaiting Payment</h1>
                    <p className="text-sm text-muted-foreground">
                        Order #{id.slice(0, 8).toUpperCase()} &bull; {formatDate(createdAt)}
                    </p>
                </div>
                <Button asChild size="sm" className="shrink-0">
                    <Link href={`/checkout/retry/${id}`}>Complete Payment</Link>
                </Button>
            </div>
        )
    }
    return (
        <div className="bg-muted/50 p-6 flex items-center gap-3">
            <XCircle className="h-8 w-8 text-muted-foreground shrink-0" />
            <div>
                <h1 className="text-lg font-semibold">Order Expired</h1>
                <p className="text-sm text-muted-foreground">
                    Order #{id.slice(0, 8).toUpperCase()} &bull; {formatDate(createdAt)}
                </p>
            </div>
            <Badge variant="outline" className="ml-auto capitalize">Expired</Badge>
        </div>
    )
}

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const order = await getOrder(id)

    if (!order) notFound()

    const addr = order.delivery_address

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 max-w-2xl">
                <div className="rounded-lg border overflow-hidden">
                    <OrderHeader status={order.status} id={order.id} createdAt={order.created_at} />

                    {/* Items */}
                    <div className="p-6 space-y-3">
                        <h2 className="font-medium">Items</h2>
                        <Separator />
                        <div className="space-y-2">
                            {order.items.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-muted-foreground flex-1 line-clamp-1">
                                        {item.product_name}
                                        {item.variant_label && (
                                            <span className="text-xs ml-1">· {item.variant_label}</span>
                                        )}
                                        <span className="ml-1 text-foreground">× {item.quantity}</span>
                                    </span>
                                    <span className="shrink-0 font-medium">{formatPrice(item.subtotal)}</span>
                                </div>
                            ))}
                        </div>
                        <Separator />
                        <div className="flex justify-between font-semibold">
                            <span>Total</span>
                            <span>{formatPrice(order.total_amount)}</span>
                        </div>
                    </div>

                    {/* Delivery Address */}
                    <div className="px-6 pb-6 space-y-3">
                        <h2 className="font-medium">Delivering to</h2>
                        <Separator />
                        <div className="text-sm space-y-0.5 text-muted-foreground">
                            <p className="text-foreground font-medium">{addr.full_name}</p>
                            <p>{addr.phone}</p>
                            <p>{addr.line1}{addr.line2 ? `, ${addr.line2}` : ""}</p>
                            <p>{addr.city}, {addr.state} {addr.pincode}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="px-6 pb-6 flex gap-3">
                        <Button asChild variant="outline" className="flex-1">
                            <Link href="/orders">View All Orders</Link>
                        </Button>
                        <Button asChild className="flex-1">
                            <Link href="/">Continue Shopping</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
