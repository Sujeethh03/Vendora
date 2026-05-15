"use client"

import { useEffect } from "react"
import Link from "next/link"
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from "lucide-react"
import { useCart } from "@/components/providers/cart-provider"
import { useAuth } from "@/components/providers/auth-provider"
import { formatPrice } from "@/lib/format"
import { config } from "@/lib/config"

const API_URL = config.api.publicBaseUrl

export function CartDrawer() {
    const { user } = useAuth()
    const {
        items, totalItems, totalAmount, minOrderAmount,
        isOpen, closeCart, removeItem, updateQuantity, isLoading,
    } = useCart()

    // Lock body scroll when drawer is open
    useEffect(() => {
        document.body.style.overflow = isOpen ? "hidden" : ""
        return () => { document.body.style.overflow = "" }
    }, [isOpen])

    // Close on Escape
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") closeCart() }
        window.addEventListener("keydown", handler)
        return () => window.removeEventListener("keydown", handler)
    }, [closeCart])

    const meetsMinOrder = totalAmount >= minOrderAmount

    return (
        <>
            {/* Backdrop */}
            <div
                className={`fixed inset-0 z-50 transition-all duration-300 ${
                    isOpen ? "pointer-events-auto" : "pointer-events-none"
                }`}
                onClick={closeCart}
                style={{
                    backdropFilter: isOpen ? "blur(4px)" : "blur(0px)",
                    backgroundColor: isOpen ? "rgba(0,0,0,0.4)" : "rgba(0,0,0,0)",
                    transition: "backdrop-filter 300ms, background-color 300ms",
                }}
            />

            {/* Drawer panel */}
            <div
                className={`fixed top-0 right-0 h-full w-full sm:w-[420px] z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
                    isOpen ? "translate-x-0" : "translate-x-full"
                }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <div className="flex items-center gap-2">
                        <ShoppingBag className="h-5 w-5 text-[#2D6A4F]" />
                        <h2 className="font-bold text-lg text-gray-900">Your Cart</h2>
                        {totalItems > 0 && (
                            <span className="text-xs font-semibold bg-[#2D6A4F] text-white px-2 py-0.5 rounded-full">
                                {totalItems}
                            </span>
                        )}
                    </div>
                    <button
                        onClick={closeCart}
                        className="h-8 w-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {!user ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                            <span className="text-5xl">🛒</span>
                            <p className="font-semibold text-gray-800">Sign in to see your cart</p>
                            <Link
                                href="/login"
                                onClick={closeCart}
                                className="px-6 py-2 bg-[#2D6A4F] text-white rounded-full text-sm font-semibold hover:bg-[#1B4332] transition-colors"
                            >
                                Login
                            </Link>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                            <span className="text-5xl">🌿</span>
                            <p className="font-semibold text-gray-800">Your cart is empty</p>
                            <p className="text-sm text-gray-500">Add some fresh produce to get started</p>
                            <button
                                onClick={closeCart}
                                className="px-6 py-2 bg-[#2D6A4F] text-white rounded-full text-sm font-semibold hover:bg-[#1B4332] transition-colors"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-3 px-5 py-4">
                                    {/* Product image */}
                                    <div className="h-16 w-16 rounded-xl overflow-hidden bg-gray-100 shrink-0">
                                        {item.product_image ? (
                                            <img
                                                src={`${API_URL}${item.product_image}`}
                                                alt={item.product_name}
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <div className="h-full w-full flex items-center justify-center">
                                                <ShoppingBag className="h-6 w-6 text-gray-300" />
                                            </div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm text-gray-900 truncate">
                                            {item.product_name}
                                        </p>
                                        {item.variant_label && (
                                            <p className="text-xs text-gray-500 mt-0.5">{item.variant_label}</p>
                                        )}
                                        <p className="text-sm font-bold text-[#2D6A4F] mt-1">
                                            {formatPrice(item.price)}
                                        </p>

                                        {/* Quantity controls */}
                                        <div className="flex items-center gap-2 mt-2">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                disabled={isLoading || item.quantity <= 1}
                                                className="h-6 w-6 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                                            >
                                                <Minus className="h-3 w-3" />
                                            </button>
                                            <span className="text-sm font-semibold w-5 text-center">
                                                {item.quantity}
                                            </span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                disabled={isLoading}
                                                className="h-6 w-6 rounded-full border flex items-center justify-center text-gray-600 hover:bg-gray-100 disabled:opacity-40 transition-colors"
                                            >
                                                <Plus className="h-3 w-3" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Subtotal + remove */}
                                    <div className="flex flex-col items-end justify-between shrink-0">
                                        <button
                                            onClick={() => removeItem(item.id)}
                                            disabled={isLoading}
                                            className="h-6 w-6 rounded-full flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                        <p className="text-sm font-bold text-gray-800">
                                            {formatPrice(item.subtotal)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer — only when cart has items */}
                {user && items.length > 0 && (
                    <div className="border-t px-5 py-4 space-y-3 bg-white">
                        {/* Min order notice */}
                        {!meetsMinOrder && (
                            <div className="text-xs text-center text-[#F4845F] font-medium bg-[#F4845F]/10 rounded-lg py-2">
                                Add {formatPrice(minOrderAmount - totalAmount)} more to place an order
                            </div>
                        )}

                        {/* Totals */}
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                            <span className="font-bold text-gray-900">{formatPrice(totalAmount)}</span>
                        </div>
                        <p className="text-xs text-gray-400 -mt-1">Delivery charges calculated at checkout</p>

                        {/* CTA buttons */}
                        <Link
                            href="/checkout"
                            onClick={closeCart}
                            className={`flex items-center justify-center gap-2 w-full py-3 rounded-full text-sm font-bold transition-colors ${
                                meetsMinOrder
                                    ? "bg-[#2D6A4F] text-white hover:bg-[#1B4332]"
                                    : "bg-gray-200 text-gray-400 pointer-events-none"
                            }`}
                        >
                            Proceed to Checkout <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link
                            href="/cart"
                            onClick={closeCart}
                            className="flex items-center justify-center w-full py-2.5 rounded-full text-sm font-semibold text-[#2D6A4F] border border-[#2D6A4F] hover:bg-green-50 transition-colors"
                        >
                            View Full Cart
                        </Link>
                    </div>
                )}
            </div>
        </>
    )
}
