"use client"

import Link from "next/link"
import { Minus, Plus, Trash2, ShoppingCart, Package, AlertCircle } from "lucide-react"
import { Navbar } from "@/components/features/navbar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { useCart } from "@/components/providers/cart-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { config } from "@/lib/config"
import { formatPrice } from "@/lib/format"

const API_URL = config.api.publicBaseUrl

export default function CartPage() {
    const { user, isLoading: authLoading } = useAuth()
    const { items, totalItems, totalAmount, minOrderAmount, isLoading, isInitializing, updateQuantity, removeItem, clearCart } = useCart()

    if (authLoading || isInitializing) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-8 max-w-5xl space-y-4">
                    <Skeleton className="h-8 w-48" />
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2 space-y-4">
                            {[1, 2, 3].map((i) => (
                                <Skeleton key={i} className="h-28 w-full rounded-lg" />
                            ))}
                        </div>
                        <Skeleton className="h-64 w-full rounded-lg" />
                    </div>
                </main>
            </div>
        )
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-16 flex flex-col items-center gap-4 text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                    <h1 className="text-2xl font-bold">Your cart is waiting</h1>
                    <p className="text-muted-foreground">Login to view your cart</p>
                    <Button asChild>
                        <Link href="/login?redirect=/cart">Login</Link>
                    </Button>
                </main>
            </div>
        )
    }

    if (items.length === 0) {
        return (
            <div className="min-h-screen bg-background">
                <Navbar />
                <main className="container py-16 flex flex-col items-center gap-4 text-center">
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <h1 className="text-2xl font-bold">Your cart is empty</h1>
                    <p className="text-muted-foreground">Add some products to get started</p>
                    <Button asChild>
                        <Link href="/">Browse products</Link>
                    </Button>
                </main>
            </div>
        )
    }

    const belowMinimum = minOrderAmount > 0 && totalAmount < minOrderAmount
    const remaining = minOrderAmount - totalAmount

    return (
        <div className="min-h-screen bg-background">
            <Navbar />
            <main className="container py-8 max-w-5xl">
                <h1 className="text-2xl font-bold mb-6">
                    Your Cart{" "}
                    <span className="text-muted-foreground font-normal text-lg">
                        ({totalItems} {totalItems === 1 ? "item" : "items"})
                    </span>
                </h1>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Cart Items */}
                    <div className="lg:col-span-2 space-y-4">
                        {items.map((item) => (
                            <div key={item.id} className="flex gap-4 rounded-lg border p-4">
                                <div className="h-20 w-20 shrink-0 rounded-md border overflow-hidden bg-muted flex items-center justify-center">
                                    {item.product_image ? (
                                        <img
                                            src={`${API_URL}${item.product_image}`}
                                            alt={item.product_name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <Package className="h-8 w-8 text-muted-foreground" />
                                    )}
                                </div>

                                <div className="flex flex-1 flex-col gap-2 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <Link
                                                href={`/products/${item.product_id}`}
                                                className="font-medium leading-snug hover:underline line-clamp-2"
                                            >
                                                {item.product_name}
                                            </Link>
                                            {item.variant_label && (
                                                <p className="text-xs text-muted-foreground mt-0.5">
                                                    {item.variant_label}
                                                </p>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            disabled={isLoading}
                                            className="shrink-0 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Remove</span>
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                disabled={isLoading}
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                            >
                                                <Minus className="h-3 w-3" />
                                            </Button>
                                            <span className="w-8 text-center text-sm font-medium">
                                                {item.quantity}
                                            </span>
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                className="h-7 w-7"
                                                disabled={isLoading}
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                            >
                                                <Plus className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">{formatPrice(item.subtotal)}</p>
                                            <p className="text-xs text-muted-foreground">
                                                {formatPrice(item.price)} each
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-destructive"
                            disabled={isLoading}
                            onClick={clearCart}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Clear cart
                        </Button>
                    </div>

                    {/* Order Summary */}
                    <div className="lg:col-span-1">
                        <div className="rounded-lg border p-6 space-y-4 sticky top-24">
                            <h2 className="font-semibold text-lg">Order Summary</h2>
                            <Separator />
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>{formatPrice(totalAmount)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span className="text-green-600 font-medium">Free</span>
                                </div>
                            </div>
                            <Separator />
                            <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span>{formatPrice(totalAmount)}</span>
                            </div>

                            {belowMinimum && (
                                <div className="flex items-start gap-2 rounded-md bg-orange-50 border border-orange-200 p-3 text-sm text-orange-700">
                                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>
                                        Add {formatPrice(remaining)} more to meet the minimum order of{" "}
                                        {formatPrice(minOrderAmount)}
                                    </span>
                                </div>
                            )}

                            <Button className="w-full" size="lg" asChild disabled={belowMinimum}>
                                <Link href={belowMinimum ? "#" : "/checkout"}>
                                    Proceed to Checkout
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    )
}
