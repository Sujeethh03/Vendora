"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function DashboardError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <AlertTriangle className="h-10 w-10 text-destructive" />
            <h2 className="text-xl font-semibold">Dashboard error</h2>
            <p className="text-muted-foreground text-sm max-w-sm">
                {error.message || "Something went wrong loading this page."}
            </p>
            <div className="flex gap-3">
                <Button onClick={reset}>Try again</Button>
                <Button variant="outline" asChild>
                    <Link href="/dashboard">Go to dashboard</Link>
                </Button>
            </div>
        </div>
    )
}
