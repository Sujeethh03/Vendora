"use client"

import Link from "next/link"
import { useAuth } from "@/components/providers/auth-provider"
import { useCart } from "@/components/providers/cart-provider"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ThemeToggle } from "@/components/theme-toggle"
import { ShoppingBag, ShoppingCart, LayoutDashboard, LogOut } from "lucide-react"

export function Navbar() {
    const { user, isLoading, logout } = useAuth()
    const { totalItems } = useCart()

    const getInitials = (email: string | undefined) => {
        if (email) return email[0].toUpperCase()
        return "V"
    }

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                    Vendora
                </Link>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    {user && !user.is_admin && (
                        <Button variant="ghost" size="icon" asChild className="relative">
                            <Link href="/cart">
                                <ShoppingCart className="h-5 w-5" />
                                {totalItems > 0 && (
                                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                                        {totalItems > 99 ? "99+" : totalItems}
                                    </span>
                                )}
                                <span className="sr-only">Cart ({totalItems})</span>
                            </Link>
                        </Button>
                    )}
                    {!isLoading && (
                        <>
                            {user ? (
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
                                            <Avatar className="h-9 w-9 border">
                                                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                                                    {getInitials(user.email)}
                                                </AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end">
                                        <DropdownMenuLabel>
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium">{user.email}</p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
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
                                    <Button variant="ghost" asChild>
                                        <Link href="/login">Login</Link>
                                    </Button>
                                    <Button asChild>
                                        <Link href="/register">Register</Link>
                                    </Button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </header>
    )
}
