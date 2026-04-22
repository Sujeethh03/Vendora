"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import Link from "next/link"
import { AlertCircle, Tag, X, Loader2 } from "lucide-react"
import { Navbar } from "@/components/features/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCart } from "@/components/providers/cart-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { placeOrder } from "@/actions/order-actions"
import { validateDiscount } from "@/actions/discount-actions"
import { verifyPayment, retryPayment } from "@/actions/payment-actions"
import { formatPrice } from "@/lib/format"
import { toast } from "sonner"
import type { CheckoutSession, ValidateDiscountResult } from "@/types"

const addressSchema = z.object({
    full_name: z.string().min(2, "Full name is required"),
    phone: z.string().regex(/^\d{10}$/, "Enter a valid 10-digit phone number"),
    line1: z.string().min(5, "Address line 1 is required"),
    line2: z.string().optional(),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().regex(/^\d{6}$/, "Enter a valid 6-digit pincode"),
})

type AddressForm = z.infer<typeof addressSchema>

export default function CheckoutPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { items, totalAmount, minOrderAmount, resetCart } = useCart()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isVerifying, setIsVerifying] = useState(false)
    const [session, setSession] = useState<CheckoutSession | null>(null)
    const [dismissed, setDismissed] = useState(false)
    const [couponCode, setCouponCode] = useState("")
    const [isValidating, setIsValidating] = useState(false)
    const [couponError, setCouponError] = useState<string | null>(null)
    const [appliedCoupon, setAppliedCoupon] = useState<ValidateDiscountResult | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<AddressForm>({ resolver: zodResolver(addressSchema) })

    useEffect(() => {
        const script = document.createElement("script")
        script.src = "https://checkout.razorpay.com/v1/checkout.js"
        script.async = true
        document.body.appendChild(script)
        return () => {
            document.body.removeChild(script)
        }
    }, [])

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
                    setIsSubmitting(false)
                    toast("Payment cancelled. Use the button below to retry.")
                },
            },
        })
        rzp.open()
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return
        setIsValidating(true)
        setCouponError(null)
        const result = await validateDiscount(couponCode.trim(), totalAmount)
        setIsValidating(false)
        if (!result.success || !result.data) {
            setCouponError(result.error || "Invalid coupon code")
            return
        }
        setAppliedCoupon(result.data)
        setCouponCode("")
    }

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null)
        setCouponCode("")
        setCouponError(null)
    }

    const onSubmit = async (formData: AddressForm) => {
        setIsSubmitting(true)
        const result = await placeOrder(
            { ...formData, line2: formData.line2 || null },
            appliedCoupon?.code
        )
        if (!result.success || !result.data) {
            toast.error(result.error || "Failed to place order")
            setIsSubmitting(false)
            return
        }
        const s = result.data
        setSession(s)
        resetCart()
        openModal(s)
    }

    const handleRetry = async () => {
        if (!session) return
        setIsSubmitting(true)
        setDismissed(false)
        const result = await retryPayment(session.order_id)
        if (!result.success || !result.data) {
            toast.error(result.error || "Failed to retry payment")
            setIsSubmitting(false)
            setDismissed(true)
            return
        }
        const newSession = result.data
        setSession(newSession)
        setIsSubmitting(false)
        openModal(newSession)
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-16 flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">Login to proceed to checkout</p>
                    <Button asChild>
                        <Link href="/login?redirect=/checkout">Login</Link>
                    </Button>
                </main>
            </div>
        )
    }

    if (items.length === 0 && !session) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-16 flex flex-col items-center gap-4 text-center">
                    <p className="text-muted-foreground">Your cart is empty</p>
                    <Button asChild variant="outline">
                        <Link href="/">Browse products</Link>
                    </Button>
                </main>
            </div>
        )
    }

    const orderItems = session ? [] : items
    const orderTotal = session ? session.amount / 100 : totalAmount
    const belowMinimum = !session && minOrderAmount > 0 && totalAmount < minOrderAmount

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 max-w-5xl">
                <h1 className="text-2xl font-bold mb-6">Checkout</h1>

                <form onSubmit={handleSubmit(onSubmit)}>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Delivery Address */}
                        <div className="lg:col-span-2 space-y-6">
                            <div className="rounded-lg border p-6 space-y-4">
                                <h2 className="font-semibold text-lg">Delivery Address</h2>
                                <Separator />

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="full_name">Full Name</Label>
                                        <Input
                                            id="full_name"
                                            {...register("full_name")}
                                            placeholder="Sujeeth Kumar"
                                            disabled={!!session}
                                        />
                                        {errors.full_name && (
                                            <p className="text-xs text-destructive">{errors.full_name.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="phone">Phone Number</Label>
                                        <Input
                                            id="phone"
                                            {...register("phone")}
                                            placeholder="9876543210"
                                            disabled={!!session}
                                        />
                                        {errors.phone && (
                                            <p className="text-xs text-destructive">{errors.phone.message}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="line1">Address Line 1</Label>
                                    <Input
                                        id="line1"
                                        {...register("line1")}
                                        placeholder="42 MG Road"
                                        disabled={!!session}
                                    />
                                    {errors.line1 && (
                                        <p className="text-xs text-destructive">{errors.line1.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="line2">Address Line 2 (optional)</Label>
                                    <Input
                                        id="line2"
                                        {...register("line2")}
                                        placeholder="Apt 3B, Floor 2"
                                        disabled={!!session}
                                    />
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="city">City</Label>
                                        <Input
                                            id="city"
                                            {...register("city")}
                                            placeholder="Bengaluru"
                                            disabled={!!session}
                                        />
                                        {errors.city && (
                                            <p className="text-xs text-destructive">{errors.city.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="state">State</Label>
                                        <Input
                                            id="state"
                                            {...register("state")}
                                            placeholder="Karnataka"
                                            disabled={!!session}
                                        />
                                        {errors.state && (
                                            <p className="text-xs text-destructive">{errors.state.message}</p>
                                        )}
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label htmlFor="pincode">Pincode</Label>
                                        <Input
                                            id="pincode"
                                            {...register("pincode")}
                                            placeholder="560001"
                                            disabled={!!session}
                                        />
                                        {errors.pincode && (
                                            <p className="text-xs text-destructive">{errors.pincode.message}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-1">
                            <div className="rounded-lg border p-6 space-y-4 sticky top-24">
                                <h2 className="font-semibold text-lg">Order Summary</h2>
                                <Separator />
                                <div className="space-y-2 text-sm max-h-60 overflow-y-auto">
                                    {orderItems.map((item) => (
                                        <div key={item.id} className="flex justify-between gap-2">
                                            <span className="text-muted-foreground line-clamp-1 flex-1">
                                                {item.product_name}
                                                {item.variant_label && ` · ${item.variant_label}`}
                                                {" × "}{item.quantity}
                                            </span>
                                            <span className="shrink-0">{formatPrice(item.subtotal)}</span>
                                        </div>
                                    ))}
                                </div>
                                <Separator />
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Shipping</span>
                                        <span className="text-green-600 font-medium">Free</span>
                                    </div>
                                </div>
                                <Separator />
                                <div className="flex justify-between font-semibold">
                                    <span>Total</span>
                                    <span>{formatPrice(orderTotal)}</span>
                                </div>

                                {belowMinimum && (
                                    <div className="flex items-start gap-2 rounded-md bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>
                                            Minimum order is {formatPrice(minOrderAmount)}. Add{" "}
                                            {formatPrice(minOrderAmount - totalAmount)} more to proceed.
                                        </span>
                                    </div>
                                )}

                                {dismissed ? (
                                    <Button
                                        type="button"
                                        className="w-full"
                                        size="lg"
                                        onClick={handleRetry}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? "Opening Payment…" : "Retry Payment"}
                                    </Button>
                                ) : isVerifying ? (
                                    <Button className="w-full" size="lg" disabled>
                                        Verifying Payment…
                                    </Button>
                                ) : session ? (
                                    <Button className="w-full" size="lg" disabled>
                                        Opening Payment…
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        className="w-full"
                                        size="lg"
                                        disabled={isSubmitting || belowMinimum}
                                    >
                                        {isSubmitting ? "Processing…" : "Pay Now"}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                </form>
            </main>
        </div>
    )
}
