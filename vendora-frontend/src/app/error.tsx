"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export default function GlobalError({
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
        <div className="min-h-screen flex items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 text-center max-w-md px-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h1 className="text-2xl font-bold">Something went wrong</h1>
                <p className="text-muted-foreground text-sm">
                    {error.message || "An unexpected error occurred. Please try again."}
                </p>
                <Button onClick={reset}>Try again</Button>
            </div>
        </div>
    )
}
