"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Package, LogOut, ShoppingBag } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { logout } from "@/actions/auth-actions"
import { User } from "@/types"
import { ThemeToggle } from "@/components/theme-toggle"

const sidebarItems = [
    { icon: Package, label: "My Listings", href: "/dashboard" },
]

interface DashboardSidebarProps {
    className?: string
    user: User | null
}

export function DashboardSidebar({ className, user }: DashboardSidebarProps) {
    const pathname = usePathname()

    const getInitials = (name: string | undefined) => {
        if (!name) return "V"
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .slice(0, 2)
            .toUpperCase()
    }

    const displayName = user?.email || "Vendora User"
    const initials = getInitials(user?.email)

    return (
        <aside className={cn("border-r bg-card h-full flex flex-col", className)}>
            <div className="h-16 flex items-center px-6 border-b">
                <Link href="/" className="flex items-center gap-2 font-bold text-xl">
                    <ShoppingBag className="h-6 w-6 text-primary" />
                    Vendora
                </Link>
            </div>

            <div className="flex-1 py-4 flex flex-col gap-1 px-4">
                {sidebarItems.map((item) => {
                    const isActive = pathname === item.href
                    return (
                        <Link key={item.href} href={item.href}>
                            <Button
                                variant={isActive ? "secondary" : "ghost"}
                                className={cn(
                                    "w-full justify-start gap-3",
                                    isActive && "bg-secondary text-secondary-foreground"
                                )}
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Button>
                        </Link>
                    )
                })}
            </div>

            <div className="p-4 border-t space-y-4">
                <div className="flex items-center justify-between px-2">
                    <span className="text-sm font-medium text-muted-foreground">Theme</span>
                    <ThemeToggle />
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex-1 min-w-0">
                        <Button variant="ghost" className="w-full justify-start px-2 h-14 hover:bg-secondary/50">
                            <div className="flex items-center gap-3 overflow-hidden">
                                <Avatar className="h-9 w-9 border shrink-0">
                                    <AvatarFallback className="bg-primary/10 text-primary">{initials}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start text-left truncate">
                                    <span className="text-sm font-medium truncate w-full">{displayName}</span>
                                    <span className="text-xs text-muted-foreground capitalize">{user?.role || "user"}</span>
                                </div>
                            </div>
                        </Button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-14 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={async () => {
                            await logout()
                        }}
                    >
                        <LogOut className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </aside>
    )
}
