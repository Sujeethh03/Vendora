"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Menu, ShoppingBag } from "lucide-react"
import { DashboardSidebar } from "@/components/features/dashboard-sidebar"
import { cn } from "@/lib/utils"
import { User } from "@/types"

export function MobileNav({ mainContentId, user }: { mainContentId?: string; user: User | null }) {
    const [scrolled, setScrolled] = useState(false)

    useEffect(() => {
        const handleScroll = () => {
            if (!mainContentId) return
            const mainElement = document.getElementById(mainContentId)
            if (mainElement) {
                setScrolled(mainElement.scrollTop > 10)
            }
        }

        const mainElement = document.getElementById(mainContentId || "")
        if (mainElement) {
            mainElement.addEventListener("scroll", handleScroll)
        }

        return () => {
            if (mainElement) mainElement.removeEventListener("scroll", handleScroll)
        }
    }, [mainContentId])

    return (
        <header
            className={cn(
                "md:hidden fixed top-0 left-0 right-0 z-50 flex h-16 items-center justify-between px-6 transition-all duration-300",
                scrolled
                    ? "bg-background/80 backdrop-blur-md border-b shadow-sm"
                    : "bg-transparent"
            )}
        >
            <div className="flex items-center gap-2 font-bold text-xl">
                <ShoppingBag className="h-6 w-6 text-primary" />
                Vendora
            </div>

            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="hover:bg-primary/10">
                        <Menu className="h-6 w-6" />
                        <span className="sr-only">Toggle menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="right" className="p-0 w-72 border-l">
                    <DashboardSidebar className="border-none flex" user={user} />
                </SheetContent>
            </Sheet>
        </header>
    )
}
