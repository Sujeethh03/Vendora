import { getProducts } from "@/actions/product-actions"
import { getStoreConfig } from "@/actions/store-actions"
import { CategorySection } from "./category-section"
import { AddCategoryButton } from "./add-category-button"
import { Product } from "@/types"

async function getAllProducts() {
    const first = await getProducts({ page: "1", page_size: "100" })
    const totalPages = Math.ceil(first.total / 100)
    if (totalPages <= 1) return first.items

    const rest = await Promise.all(
        Array.from({ length: totalPages - 1 }, (_, i) =>
            getProducts({ page: String(i + 2), page_size: "100" })
        )
    )
    return [...first.items, ...rest.flatMap((r) => r.items)]
}

export default async function DashboardPage() {
    const [products, storeConfig] = await Promise.all([getAllProducts(), getStoreConfig()])
    const categoryImages = storeConfig.category_images ?? {}

    // Group by category, null → null key (Uncategorized)
    const grouped = new Map<string | null, Product[]>()
    for (const product of products) {
        const key = product.category ?? null
        if (!grouped.has(key)) grouped.set(key, [])
        grouped.get(key)!.push(product)
    }

    // Sort: named categories alphabetically first, Uncategorized last
    const namedCategories = [...grouped.keys()]
        .filter((k): k is string => k !== null)
        .sort((a, b) => a.localeCompare(b))
    const orderedKeys: (string | null)[] = [...namedCategories]
    if (grouped.has(null)) orderedKeys.push(null)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">My Listings</h1>
                    <p className="text-muted-foreground">
                        {products.length} product{products.length !== 1 ? "s" : ""} across {namedCategories.length} categor{namedCategories.length !== 1 ? "ies" : "y"}
                    </p>
                </div>
                <AddCategoryButton />
            </div>

            {products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-muted-foreground border-2 border-dashed rounded-xl">
                    <span className="text-5xl">🌿</span>
                    <p className="text-lg font-medium text-foreground">No categories yet</p>
                    <p className="text-sm">Create your first category to start adding products</p>
                    <AddCategoryButton />
                </div>
            ) : (
                <div className="space-y-4">
                    {orderedKeys.map((category) => (
                        <CategorySection
                            key={category ?? "__uncategorized__"}
                            category={category}
                            products={grouped.get(category)!}
                            imageUrl={category ? (categoryImages[category.toLowerCase()] ?? null) : null}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
