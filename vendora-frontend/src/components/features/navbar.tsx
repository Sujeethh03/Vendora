"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect, useRef, useCallback } from "react"
import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ShoppingCart, LayoutDashboard, LogOut, Search, Leaf, Package, ListOrdered, Loader2, ArrowRight } from "lucide-react"
import { browserApiClient } from "@/lib/browser-api-client"
import { StoreConfig, Product } from "@/types"
import { formatPrice } from "@/lib/format"
import { config as appConfig } from "@/lib/config"

const API_URL = appConfig.api.publicBaseUrl

interface ProductListResponse { items: Product[]; total: number }

export function Navbar() {
    const { user, isLoading, logout } = useAuth()
    const { totalItems, openCart } = useCart()
    const router = useRouter()

    const [search, setSearch] = useState("")
    const [storeConfig, setStoreConfig] = useState<StoreConfig | null>(null)
    const [categories, setCategories] = useState<string[]>([])

    const [results, setResults] = useState<Product[]>([])
    const [searching, setSearching] = useState(false)
    const [showDropdown, setShowDropdown] = useState(false)
    const searchContainerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        browserApiClient.get<StoreConfig>("/store/config")
            .then(setStoreConfig)
            .catch(() => null)

        browserApiClient.get<string[]>("/products/categories")
            .then(setCategories)
            .catch(() => [])
    }, [])

    // Debounced live search
    useEffect(() => {
        const q = search.trim()
        if (q.length < 2) {
            setResults([])
            setShowDropdown(false)
            return
        }
        setSearching(true)
        setShowDropdown(true)
        const timer = setTimeout(async () => {
            try {
                const data = await browserApiClient.get<ProductListResponse>(
                    `/products?search=${encodeURIComponent(q)}&page_size=6`
                )
                setResults(data.items)
            } catch {
                setResults([])
            } finally {
                setSearching(false)
            }
        }, 320)
        return () => clearTimeout(timer)
    }, [search])

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const storeName = storeConfig?.store_name ?? "Vendora"

    const handleSearch = (e: { preventDefault(): void }) => {
        e.preventDefault()
        setShowDropdown(false)
        if (search.trim()) {
            router.push(`/products?search=${encodeURIComponent(search.trim())}`)
        } else {
            router.push("/products")
        }
    }

    const handleResultClick = useCallback((id: string) => {
        setShowDropdown(false)
        setSearch("")
        router.push(`/products/${id}`)
    }, [router])

    return (
        <header className="sticky top-0 z-50 w-full">
            {/* Announcement bar */}
            {storeConfig?.announcement_text && (
                <div className="bg-[#1B4332] text-white text-xs text-center py-1.5 px-4 font-medium">
                    {storeConfig.announcement_text}
                </div>
            )}

            {/* Main navbar */}
            <div className="bg-[#2D6A4F]">
                <div className="container flex h-16 items-center gap-4 px-4">
                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 shrink-0">
                        <div className="bg-[#F4845F] rounded-full p-1.5">
                            <Leaf className="h-5 w-5 text-white" />
                        </div>
                        <span className="text-white font-bold text-xl tracking-tight">{storeName}</span>
                    </Link>

                    {/* Search */}
                    <div ref={searchContainerRef} className="flex-1 max-w-2xl mx-auto hidden sm:block relative">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                {searching
                                    ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                                    : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                }
                                <Input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onFocus={() => search.trim().length >= 2 && setShowDropdown(true)}
                                    placeholder="Search vegetables, fruits, grains..."
                                    className="pl-9 pr-4 bg-white text-gray-900 placeholder:text-gray-400 border-0 rounded-full h-10 focus-visible:ring-2 focus-visible:ring-[#F4845F] focus-visible:ring-offset-0"
                                    autoComplete="off"
                                />
                            </div>
                        </form>

                        {/* Live search dropdown */}
                        {showDropdown && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                                {searching ? (
                                    <div className="flex items-center justify-center py-8 gap-2 text-gray-400">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        <span className="text-sm">Searching…</span>
                                    </div>
                                ) : results.length === 0 ? (
                                    <div className="py-8 text-center text-sm text-gray-400">
                                        No products found for &ldquo;{search}&rdquo;
                                    </div>
                                ) : (
                                    <>
                                        <ul>
                                            {results.map((product) => {
                                                const img = product.images?.find(i => i.is_primary) ?? product.images?.[0]
                                                return (
                                                    <li key={product.id}>
                                                        <button
                                                            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF2] transition-colors text-left"
                                                            onClick={() => handleResultClick(product.id)}
                                                        >
                                                            {/* Thumbnail */}
                                                            <div className="h-11 w-11 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                                {img
                                                                    ? <img src={`${API_URL}${img.url}`} alt={product.name} className="h-full w-full object-cover" />
                                                                    : <div className="h-full w-full flex items-center justify-center"><Package className="h-5 w-5 text-gray-300" /></div>
                                                                }
                                                            </div>
                                                            {/* Name + category */}
                                                            <div className="flex-1 min-w-0">
                                                                <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                                                                {product.category && (
                                                                    <p className="text-xs text-gray-400 capitalize">{product.category}</p>
                                                                )}
                                                            </div>
                                                            {/* Price */}
                                                            <span className="text-sm font-bold text-[#2D6A4F] shrink-0">{formatPrice(product.price)}</span>
                                                        </button>
                                                    </li>
                                                )
                                            })}
                                        </ul>
                                        {/* View all results */}
                                        <button
                                            onClick={handleSearch}
                                            className="w-full flex items-center justify-center gap-1.5 py-3 border-t text-sm font-semibold text-[#2D6A4F] hover:bg-green-50 transition-colors"
                                        >
                                            View all results for &ldquo;{search}&rdquo;
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right actions */}
                    <div className="flex items-center gap-1 shrink-0 ml-auto sm:ml-0">
                        {user && !user.is_admin && (
                            <>
                                <Button variant="ghost" size="icon" asChild className="relative text-white hover:bg-white/15 hover:text-white rounded-full">
                                    <Link href="/orders">
                                        <ListOrdered className="h-5 w-5" />
                                        <span className="sr-only">Orders</span>
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon" className="relative text-white hover:bg-white/15 hover:text-white rounded-full" onClick={openCart}>
                                    <ShoppingCart className="h-5 w-5" />
                                    {totalItems > 0 && (
                                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[#F4845F] text-white text-[10px] font-bold flex items-center justify-center">
                                            {totalItems > 99 ? "99+" : totalItems}
                                        </span>
                                    )}
                                    <span className="sr-only">Cart</span>
                                </Button>
                            </>
                        )}

                        {!isLoading && (
                            user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-9 w-9 rounded-full p-0 hover:bg-white/15">
                                            <Avatar className="h-9 w-9 border-2 border-white/40">
                                                <AvatarFallback className="bg-[#F4845F] text-white text-sm font-bold">
                                                    {user.email[0].toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end">
                                        <DropdownMenuLabel>
                                            <p className="text-sm font-medium truncate">{user.email}</p>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        {user.is_admin && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/dashboard" className="cursor-pointer">
                                                        <LayoutDashboard className="mr-2 h-4 w-4" />
                                                        Dashboard
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        {!user.is_admin && (
                                            <>
                                                <DropdownMenuItem asChild>
                                                    <Link href="/orders" className="cursor-pointer">
                                                        <Package className="mr-2 h-4 w-4" />
                                                        My Orders
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                            </>
                                        )}
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive cursor-pointer"
                                            onClick={() => logout()}
                                        >
                                            <LogOut className="mr-2 h-4 w-4" />
                                            Logout
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" asChild className="text-white hover:bg-white/15 hover:text-white">
                                        <Link href="/login">Login</Link>
                                    </Button>
                                    <Button asChild className="bg-[#F4845F] hover:bg-[#e07050] text-white border-0 rounded-full px-5">
                                        <Link href="/register">Register</Link>
                                    </Button>
                                </div>
                            )
                        )}
                    </div>
                </div>

                {/* Mobile search */}
                <div className="sm:hidden px-4 pb-3 relative">
                    <form onSubmit={handleSearch}>
                        <div className="relative">
                            {searching
                                ? <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                                : <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            }
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onFocus={() => search.trim().length >= 2 && setShowDropdown(true)}
                                placeholder="Search products..."
                                className="pl-9 bg-white text-gray-900 border-0 rounded-full h-9 focus-visible:ring-[#F4845F] focus-visible:ring-offset-0"
                                autoComplete="off"
                            />
                        </div>
                    </form>
                    {showDropdown && (
                        <div className="absolute left-4 right-4 top-full mt-1 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                            {searching ? (
                                <div className="flex items-center justify-center py-6 gap-2 text-gray-400">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    <span className="text-sm">Searching…</span>
                                </div>
                            ) : results.length === 0 ? (
                                <div className="py-6 text-center text-sm text-gray-400">No products found</div>
                            ) : (
                                <>
                                    <ul>
                                        {results.map((product) => {
                                            const img = product.images?.find(i => i.is_primary) ?? product.images?.[0]
                                            return (
                                                <li key={product.id}>
                                                    <button
                                                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#FAFAF2] transition-colors text-left"
                                                        onClick={() => handleResultClick(product.id)}
                                                    >
                                                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                                            {img
                                                                ? <img src={`${API_URL}${img.url}`} alt={product.name} className="h-full w-full object-cover" />
                                                                : <div className="h-full w-full flex items-center justify-center"><Package className="h-4 w-4 text-gray-300" /></div>
                                                            }
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <p className="text-sm font-semibold text-gray-900 truncate">{product.name}</p>
                                                            {product.category && <p className="text-xs text-gray-400 capitalize">{product.category}</p>}
                                                        </div>
                                                        <span className="text-sm font-bold text-[#2D6A4F] shrink-0">{formatPrice(product.price)}</span>
                                                    </button>
                                                </li>
                                            )
                                        })}
                                    </ul>
                                    <button
                                        onClick={handleSearch}
                                        className="w-full flex items-center justify-center gap-1.5 py-3 border-t text-sm font-semibold text-[#2D6A4F] hover:bg-green-50 transition-colors"
                                    >
                                        View all results <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Category nav — populated from API */}
            {categories.length > 0 && (
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="container px-4">
                        <nav className="flex items-center gap-1 h-10 overflow-x-auto [&::-webkit-scrollbar]:hidden">
                            <Link href="/products" className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-[#2D6A4F] px-3 py-1.5 rounded-full hover:bg-green-50 transition-colors">
                                All Products
                            </Link>
                            {categories.map((cat) => (
                                <Link
                                    key={cat}
                                    href={`/products?category=${encodeURIComponent(cat)}`}
                                    className="whitespace-nowrap text-sm font-medium text-gray-600 hover:text-[#2D6A4F] px-3 py-1.5 rounded-full hover:bg-green-50 transition-colors capitalize"
                                >
                                    {cat}
                                </Link>
                            ))}
                        </nav>
                    </div>
                </div>
            )}
        </header>
    )
}
