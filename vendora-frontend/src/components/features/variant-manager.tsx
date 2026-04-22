"use client"

import { useState } from "react"
import { Plus, Pencil, Trash2, Check, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { createVariant, updateVariant, deleteVariant } from "@/actions/variant-actions"
import type { ProductVariant } from "@/types"

interface VariantManagerProps {
    productId: string
    initialVariants: ProductVariant[]
}

interface EditState {
    label: string
    price: string
    stock: string
}

export function VariantManager({ productId, initialVariants }: VariantManagerProps) {
    const [variants, setVariants] = useState<ProductVariant[]>(initialVariants)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editValues, setEditValues] = useState<EditState>({ label: "", price: "", stock: "" })
    const [savingId, setSavingId] = useState<string | null>(null)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Add form state
    const [adding, setAdding] = useState(false)
    const [newLabel, setNewLabel] = useState("")
    const [newPrice, setNewPrice] = useState("")
    const [newStock, setNewStock] = useState("")
    const [isAdding, setIsAdding] = useState(false)

    const startEdit = (v: ProductVariant) => {
        setEditingId(v.id)
        setEditValues({ label: v.label, price: String(v.price), stock: String(v.stock) })
    }

    const cancelEdit = () => {
        setEditingId(null)
        setEditValues({ label: "", price: "", stock: "" })
    }

    const saveEdit = async (variantId: string) => {
        const price = parseFloat(editValues.price)
        const stock = parseInt(editValues.stock)
        if (!editValues.label.trim() || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
            toast.error("Please enter valid label, price, and stock")
            return
        }
        setSavingId(variantId)
        const result = await updateVariant(productId, variantId, {
            label: editValues.label.trim(),
            price,
            stock,
        })
        setSavingId(null)
        if (!result.success) {
            toast.error(result.error || "Failed to update variant")
            return
        }
        setVariants((prev) =>
            prev.map((v) => (v.id === variantId ? result.data! : v))
        )
        setEditingId(null)
        toast.success("Variant updated")
    }

    const handleDelete = async (variantId: string) => {
        setDeletingId(variantId)
        const result = await deleteVariant(productId, variantId)
        setDeletingId(null)
        if (!result.success) {
            toast.error(result.error || "Failed to delete variant")
            return
        }
        setVariants((prev) => prev.filter((v) => v.id !== variantId))
        toast.success("Variant deleted")
    }

    const handleAdd = async () => {
        const price = parseFloat(newPrice)
        const stock = parseInt(newStock)
        if (!newLabel.trim() || isNaN(price) || price < 0 || isNaN(stock) || stock < 0) {
            toast.error("Please enter valid label, price, and stock")
            return
        }
        setIsAdding(true)
        const result = await createVariant(productId, {
            label: newLabel.trim(),
            price,
            stock,
        })
        setIsAdding(false)
        if (!result.success) {
            toast.error(result.error || "Failed to add variant")
            return
        }
        setVariants((prev) => [...prev, result.data!])
        setNewLabel("")
        setNewPrice("")
        setNewStock("")
        setAdding(false)
        toast.success("Variant added")
    }

    return (
        <div className="space-y-3">
            {variants.length === 0 && !adding && (
                <p className="text-sm text-muted-foreground py-2">
                    No variants yet. Add weight options below.
                </p>
            )}

            {/* Variant rows */}
            {variants.length > 0 && (
                <div className="rounded-md border divide-y">
                    {/* Header */}
                    <div className="grid grid-cols-[1fr_100px_80px_72px] gap-2 px-3 py-2 text-xs font-medium text-muted-foreground bg-muted/40">
                        <span>Label</span>
                        <span>Price (₹)</span>
                        <span>Stock</span>
                        <span />
                    </div>

                    {variants.map((v) =>
                        editingId === v.id ? (
                            <div key={v.id} className="grid grid-cols-[1fr_100px_80px_72px] gap-2 items-center px-3 py-2">
                                <Input
                                    value={editValues.label}
                                    onChange={(e) => setEditValues((s) => ({ ...s, label: e.target.value }))}
                                    className="h-7 text-sm"
                                    placeholder="500g"
                                />
                                <Input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={editValues.price}
                                    onChange={(e) => setEditValues((s) => ({ ...s, price: e.target.value }))}
                                    className="h-7 text-sm"
                                    placeholder="0.00"
                                />
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={editValues.stock}
                                    onChange={(e) => setEditValues((s) => ({ ...s, stock: e.target.value }))}
                                    className="h-7 text-sm"
                                    placeholder="0"
                                />
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => saveEdit(v.id)}
                                        disabled={savingId === v.id}
                                        className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                                    >
                                        {savingId === v.id ? (
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Check className="h-4 w-4" />
                                        )}
                                    </button>
                                    <button
                                        onClick={cancelEdit}
                                        className="p-1 text-muted-foreground hover:text-foreground"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div key={v.id} className="grid grid-cols-[1fr_100px_80px_72px] gap-2 items-center px-3 py-2 text-sm">
                                <span className="font-medium">{v.label}</span>
                                <span>₹{v.price}</span>
                                <span>{v.stock} units</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => startEdit(v)}
                                        className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                                    >
                                        <Pencil className="h-3.5 w-3.5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        disabled={deletingId === v.id}
                                        className="p-1 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                                    >
                                        {deletingId === v.id ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        ) : (
                                            <Trash2 className="h-3.5 w-3.5" />
                                        )}
                                    </button>
                                </div>
                            </div>
                        )
                    )}
                </div>
            )}

            {/* Add form */}
            {adding ? (
                <div className="rounded-md border p-3 space-y-3">
                    <p className="text-sm font-medium">New Variant</p>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Label *</label>
                            <Input
                                value={newLabel}
                                onChange={(e) => setNewLabel(e.target.value)}
                                placeholder="e.g. 500g, 1kg"
                                className="h-8 text-sm"
                                autoFocus
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Price (₹) *</label>
                            <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={newPrice}
                                onChange={(e) => setNewPrice(e.target.value)}
                                placeholder="0.00"
                                className="h-8 text-sm"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs text-muted-foreground">Stock *</label>
                            <Input
                                type="number"
                                min="0"
                                step="1"
                                value={newStock}
                                onChange={(e) => setNewStock(e.target.value)}
                                placeholder="0"
                                className="h-8 text-sm"
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button size="sm" onClick={handleAdd} disabled={isAdding}>
                            {isAdding && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
                            Add Variant
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                setAdding(false)
                                setNewLabel("")
                                setNewPrice("")
                                setNewStock("")
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            ) : (
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAdding(true)}
                    className="gap-1.5"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Add Variant
                </Button>
            )}
        </div>
    )
}
