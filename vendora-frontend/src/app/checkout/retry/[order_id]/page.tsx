"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { AlertCircle, Clock } from "lucide-react"
import { Navbar } from "@/components/features/navbar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { getOrder } from "@/actions/order-actions"
import { verifyPayment, retryPayment } from "@/actions/payment-actions"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"
import type { Order, CheckoutSession } from "@/types"

export default function RetryCheckoutPage() {
    const router = useRouter()
    const { order_id } = useParams<{ order_id: string }>()

    const [order, setOrder] = useState<Order | null>(null)
    const [session, setSession] = useState<CheckoutSession | null>(null)
    const [expired, setExpired] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [dismissed, setDismissed] = useState(false)
    const [isRetrying, setIsRetrying] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [rzpReady, setRzpReady] = useState(false)
    const hasAutoOpened = useRef(false)

    useEffect(() => {
        if ((window as any).Razorpay) {
            setRzpReady(true)
            return
        }
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.onload = () => setRzpReady(true)
        script.async = true
        document.body.appendChild(script)
        return () => {
            document.body.removeChild(script)
        }
    }, [])

    useEffect(() => {
        const init = async () => {
            const [orderData, paymentResult] = await Promise.all([
                getOrder(order_id),
                retryPayment(order_id),
            ])
            setOrder(orderData)

            if (!paymentResult.success || !paymentResult.data) {
                const msg = paymentResult.error || "Failed to initialize payment"
                if (msg.toLowerCase().includes("expired")) {
                    setExpired(true)
                } else {
                    setError(msg)
                }
                return
            }
            setSession(paymentResult.data)
        }
        init()
    }, [order_id])

    // Auto-open modal once both script and session are ready
    useEffect(() => {
        if (rzpReady && session && !hasAutoOpened.current) {
            hasAutoOpened.current = true
            openModal(session)
        }
    }, [rzpReady, session])

    const openModal = (s: CheckoutSession) => {
        const rzp = new (window as any).Razorpay({
            key: s.key_id,
            order_id: s.razorpay_order_id,
            amount: s.amount,
            currency: s.currency,
            name: s.name,
            description: s.description,
            handler: async (response: {
                razorpay_payment_id: string
                razorpay_order_id: string
                razorpay_signature: string
            }) => {
                setIsVerifying(true)
                const result = await verifyPayment({
                    order_id: s.order_id,
                    razorpay_order_id: response.razorpay_order_id,
                    razorpay_payment_id: response.razorpay_payment_id,
                    razorpay_signature: response.razorpay_signature,
                })
                if (!result.success) {
                    toast.error(result.error || "Payment verification failed")
                    setIsVerifying(false)
                    return
                }
                router.push(`/orders/${s.order_id}`)
            },
            modal: {
                ondismiss: () => {
                    setDismissed(true)
                    toast("Payment cancelled. Use the button below to try again.")
                },
            },
        })
        rzp.open()
    }

    const handleTryAgain = async () => {
        setIsRetrying(true)
        setDismissed(false)
        const result = await retryPayment(order_id)
        if (!result.success || !result.data) {
            const msg = result.error || "Failed to retry payment"
            if (msg.toLowerCase().includes("expired")) {
                setExpired(true)
            } else {
                toast.error(msg)
                setDismissed(true)
            }
            setIsRetrying(false)
            return
        }
        const newSession = result.data
        setSession(newSession)
        setIsRetrying(false)
        openModal(newSession)
    }

    // Loading state — waiting for both order and payment session
    if (!expired && !error && (!order || !session) && !dismissed) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-16 flex flex-col items-center gap-3 text-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    <p className="text-muted-foreground text-sm">Initializing payment…</p>
                </main>
            </div>
        )
    }

    if (expired) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-16 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
                    <Clock className="h-12 w-12 text-muted-foreground" />
                    <h1 className="text-xl font-semibold">Payment Link Expired</h1>
                    <p className="text-sm text-muted-foreground">
                        This order's 30-minute payment window has passed. The items have been released back to stock.
                    </p>
                    <Button asChild>
                        <Link href="/">Return to Shop</Link>
                    </Button>
                </main>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-16 flex flex-col items-center gap-4 text-center max-w-sm mx-auto">
                    <AlertCircle className="h-12 w-12 text-destructive" />
                    <h1 className="text-xl font-semibold">Something went wrong</h1>
                    <p className="text-sm text-muted-foreground">{error}</p>
                    <Button asChild variant="outline">
                        <Link href="/orders">View Orders</Link>
                    </Button>
                </main>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 max-w-md">
                <div className="rounded-lg border overflow-hidden">
                    <div className="p-6 space-y-1">
                        <h1 className="font-semibold text-lg">Complete Your Payment</h1>
                        <p className="text-sm text-muted-foreground">
                            Order #{order_id.slice(0, 8).toUpperCase()}
                        </p>
                    </div>

                    {order && (
                        <>
                            <Separator />
                            <div className="p-6 space-y-3">
                                <div className="space-y-2 text-sm">
                                    {order.items.map((item, i) => (
                                        <div key={i} className="flex justify-between gap-2">
                                            <span className="text-muted-foreground line-clamp-1 flex-1">
                                                {item.product_name} × {item.quantity}
                                            </span>
                                            <span className="shrink-0">{formatPrice(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold text-sm">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total_amount)}</span>
                                </div>
                            </div>
                        </>
                    )}

                    <div className="px-6 pb-6 space-y-2">
                        {isVerifying ? (
                            <Button className="w-full" size="lg" disabled>
                                Verifying Payment…
                            </Button>
                        ) : dismissed ? (
                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleTryAgain}
                                disabled={isRetrying}
                            >
                                {isRetrying ? "Opening Payment…" : "Try Again"}
                            </Button>
                        ) : (
                            <Button className="w-full" size="lg" disabled>
                                Opening Payment…
                            </Button>
                        )}
                        <Button asChild variant="ghost" className="w-full" size="sm">
                            <Link href="/orders">View All Orders</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </div>
    )
}
