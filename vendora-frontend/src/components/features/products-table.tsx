"use client"

import { useState } from "react"
import {
    useReactTable,
    getCoreRowModel,
    flexRender,
    ColumnDef,
} from "@tanstack/react-table"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Pencil, Trash2, Package, ImageOff } from "lucide-react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
import { Product } from "@/types"
import { deleteProduct } from "@/actions/product-actions"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { ConfirmDeleteDialog } from "@/components/features/confirm-delete-dialog"

const formatPrice = (price: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(price)

interface ProductsTableProps {
    products: Product[]
}

export function ProductsTable({ products }: ProductsTableProps) {
    const router = useRouter()
    const [deletingId, setDeletingId] = useState<string | null>(null)

    const handleDelete = async (id: string) => {
        setDeletingId(id)
        try {
            const result = await deleteProduct(id)
            if (result.success) {
                toast.success("Product deleted successfully")
                router.refresh()
            } else {
                toast.error(result.error || "Failed to delete product")
            }
        } catch (error) {
            toast.error("Failed to delete product")
        } finally {
            setDeletingId(null)
        }
    }

    const columns: ColumnDef<Product>[] = [
        {
            id: "image",
            header: "Image",
            cell: ({ row }) => {
                const images = row.original.images
                const primary = images?.find((img) => img.is_primary) ?? images?.[0]
                return primary ? (
                    <img
                        src={`${API_URL}${primary.url}`}
                        alt={row.original.name}
                        className="h-12 w-12 rounded-md object-cover border"
                    />
                ) : (
                    <div className="h-12 w-12 rounded-md border bg-muted flex items-center justify-center">
                        <ImageOff className="h-4 w-4 text-muted-foreground" />
                    </div>
                )
            },
        },
        {
            accessorKey: "name",
            header: "Name",
            cell: ({ row }) => (
                <Link
                    href={`/products/${row.original.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:underline"
                >
                    {row.getValue("name")}
                </Link>
            ),
        },
        {
            accessorKey: "category",
            header: "Category",
            cell: ({ row }) => {
                const category = row.getValue("category") as string | undefined
                return category ? (
                    <Badge variant="secondary">{category}</Badge>
                ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                )
            },
        },
        {
            accessorKey: "price",
            header: "Price",
            cell: ({ row }) => formatPrice(row.getValue("price")),
        },
        {
            accessorKey: "stock",
            header: "Stock",
            cell: ({ row }) => (
                <span>{row.getValue("stock")} units</span>
            ),
        },
        {
            id: "actions",
            header: "Actions",
            cell: ({ row }) => {
                const product = row.original
                return (
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href={`/dashboard/products/${product.id}`}>
                                <Pencil className="h-4 w-4" />
                                <span className="sr-only">Edit</span>
                            </Link>
                        </Button>
                        <ConfirmDeleteDialog onConfirm={() => handleDelete(product.id)}>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                disabled={deletingId === product.id}
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Delete</span>
                            </Button>
                        </ConfirmDeleteDialog>
                    </div>
                )
            },
        },
    ]

    const table = useReactTable({
        data: products,
        columns,
        getCoreRowModel: getCoreRowModel(),
    })

    if (products.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 gap-4 text-muted-foreground">
                <Package className="h-12 w-12" />
                <p className="text-lg font-medium">You haven&apos;t listed anything yet</p>
                <p className="text-sm">Add your first product to get started</p>
                <Button asChild>
                    <Link href="/dashboard/products/new">Add Product</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id}>
                            {headerGroup.headers.map((header) => (
                                <TableHead key={header.id}>
                                    {header.isPlaceholder
                                        ? null
                                        : flexRender(
                                            header.column.columnDef.header,
                                            header.getContext()
                                        )}
                                </TableHead>
                            ))}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {table.getRowModel().rows.map((row) => (
                        <TableRow key={row.id}>
                            {row.getVisibleCells().map((cell) => (
                                <TableCell key={cell.id}>
                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                </TableCell>
                            ))}
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
