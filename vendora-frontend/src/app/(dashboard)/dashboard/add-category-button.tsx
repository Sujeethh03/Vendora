"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { FolderPlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export function AddCategoryButton() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [name, setName] = useState("")
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 50)
        } else {
            setName("")
        }
    }, [open])

    function handleSubmit(e: { preventDefault(): void }) {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) return
        router.push(`/dashboard/products/new?category=${encodeURIComponent(trimmed)}`)
        setOpen(false)
    }

    return (
        <>
            <Button onClick={() => setOpen(true)} className="gap-2">
                <FolderPlus className="h-4 w-4" />
                Add Category
            </Button>

            {open && (
                <div className="fixed inset-0 z-50 flex items-center justify-center">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        onClick={() => setOpen(false)}
                    />

                    {/* Dialog */}
                    <div className="relative bg-card border rounded-2xl shadow-xl p-6 w-full max-w-sm mx-4 z-10">
                        <button
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>

                        <div className="mb-5">
                            <h2 className="text-lg font-bold">New Category</h2>
                            <p className="text-sm text-muted-foreground mt-1">
                                You'll add the first product right after.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="cat-name">Category name</Label>
                                <Input
                                    id="cat-name"
                                    ref={inputRef}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="e.g. Vegetables, Dairy, Spices…"
                                />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <Button type="submit" disabled={!name.trim()} className="flex-1">
                                    Continue
                                </Button>
                                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
