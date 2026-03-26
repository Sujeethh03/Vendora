"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { createProduct } from "@/actions/product-actions"
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ImageUploader } from "@/components/features/image-uploader"
import { Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import Link from "next/link"
import { ProductImage } from "@/types"

const createProductSchema = z.object({
    name: z.string().min(1, "Product name is required"),
    description: z.string().optional(),
    price: z.string().min(1, "Price is required").refine((v) => !isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 999999999999.99, "Price must be a positive number"),
    stock: z.string().min(1, "Stock is required").refine((v) => !isNaN(Number(v)) && Number.isInteger(Number(v)) && Number(v) >= 0, "Stock must be a non-negative integer"),
    category: z.string().optional(),
})

type CreateProductValues = z.infer<typeof createProductSchema>

export default function NewProductPage() {
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [createdProductId, setCreatedProductId] = useState<string | null>(null)
    const [uploadedImages, setUploadedImages] = useState<ProductImage[]>([])

    const form = useForm<CreateProductValues>({
        resolver: zodResolver(createProductSchema),
        defaultValues: {
            name: "",
            description: "",
            price: "",
            stock: "",
            category: "",
        },
    })

    async function onSubmit(data: CreateProductValues) {
        setIsSubmitting(true)
        try {
            const result = await createProduct({
                name: data.name,
                description: data.description || undefined,
                price: Number(data.price),
                stock: Number(data.stock),
                category: data.category || undefined,
            })

            if (result.success && result.data) {
                setCreatedProductId(result.data.id)
            } else {
                toast.error(result.error || "Failed to create product")
            }
        } catch {
            toast.error("An unexpected error occurred")
        } finally {
            setIsSubmitting(false)
        }
    }

    function handleFinish() {
        if (uploadedImages.length === 0) {
            toast.error("Please upload at least one image before finishing.")
            return
        }
        toast.success("Product created successfully!")
        router.push("/dashboard")
    }

    // Step 2 — image upload
    if (createdProductId) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight">Add Product Images</h1>
                        <p className="text-muted-foreground">At least one image is required</p>
                    </div>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Product Images *</CardTitle>
                        <CardDescription>
                            Upload photos of your product. The first image will be the primary thumbnail.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ImageUploader
                            productId={createdProductId}
                            initialImages={[]}
                            onImagesChange={setUploadedImages}
                        />
                        <div className="flex gap-3 pt-2">
                            <Button
                                onClick={handleFinish}
                                disabled={uploadedImages.length === 0}
                            >
                                <CheckCircle2 className="mr-2 h-4 w-4" />
                                Finish &amp; Publish
                            </Button>
                            {uploadedImages.length === 0 && (
                                <p className="text-sm text-muted-foreground self-center">
                                    Upload at least 1 image to continue
                                </p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>
        )
    }

    // Step 1 — product details
    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                    </Link>
                </Button>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Create Product</h1>
                    <p className="text-muted-foreground">Step 1 of 2 — Product details</p>
                </div>
            </div>

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
                                    Next: Add Images
                                </Button>
                                <Button type="button" variant="ghost" asChild>
                                    <Link href="/dashboard">Cancel</Link>
                                </Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    )
}
