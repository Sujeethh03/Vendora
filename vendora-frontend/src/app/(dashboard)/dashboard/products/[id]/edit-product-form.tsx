"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { updateProduct } from "@/actions/product-actions"
import { Product } from "@/types"
import { Button } from "@/components/ui/button"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import Link from "next/link"
import { ImageUploader } from "@/components/features/image-uploader"
import { VariantManager } from "@/components/features/variant-manager"

const editProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.string().min(1, "Price is required").refine((v) => !isNaN(Number(v)) && Number(v) >= 0, "Price must be a positive number"),
    stock: z.string().min(1, "Stock is required").refine((v) => !isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) >= 0, "Stock must be a non-negative integer"),
    category: z.string().optional(),
})

type EditProductValues = z.infer<typeof editProductSchema>

interface EditProductFormProps {
    product: Product
}

export function EditProductForm({ product }: EditProductFormProps) {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<EditProductValues>({
        resolver: zodResolver(editProductSchema),
        defaultValues: {
            name: product.name,
            description: product.description || "",
            price: String(product.price),
            stock: String(product.stock),
            category: product.category || "",
        },
    })

    async function onSubmit(data: EditProductValues) {
        setIsSubmitting(true)
        try {
            const result = await updateProduct(product.id, {
                name: data.name,
                description: data.description || undefined,
                price: Number(data.price),
                stock: Number(data.stock),
                category: data.category || undefined,
            })

            if (result.success) {
                toast.success("Product updated successfully!")
                router.push("/dashboard")
            } else {
                toast.error(result.error || "Failed to update product")
            }
        } catch (error) {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <>
        <Card>
            <CardHeader>
                <CardTitle>Product Images</CardTitle>
            </CardHeader>
            <CardContent>
                <ImageUploader productId={product.id} initialImages={product.images ?? []} />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Weight / Size Variants</CardTitle>
            </CardHeader>
            <CardContent>
                <VariantManager productId={product.id} initialVariants={product.variants ?? []} />
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Product Details</CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Product Name *</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Enter product name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Describe your product..."
                                            className="min-h-[100px]"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="price"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Price (₹) *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                placeholder="0.00"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="stock"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Stock *</FormLabel>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="1"
                                                placeholder="0"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g. Electronics, Clothing..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="flex gap-3 pt-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                            <Button type="button" variant="ghost" asChild>
                                <Link href="/dashboard">Cancel</Link>
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
        </>
    )
}
