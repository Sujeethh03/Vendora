import { getStoreConfig, getCategories } from "@/actions/store-actions"
import { Navbar } from "@/components/features/navbar"
import { Footer } from "@/components/features/footer"
import { CategoryProductBrowser } from "./products-browser"

export default async function AllProductsPage() {
    const [storeConfig, categories] = await Promise.all([
        getStoreConfig(),
        getCategories(),
    ])

    return (
        <div className="min-h-screen bg-[#FAFAF2]">
            <Navbar />
            <CategoryProductBrowser
                categories={categories}
                lowStockThreshold={storeConfig.low_stock_threshold}
                categoryImages={storeConfig.category_images ?? {}}
            />
            <Footer categories={categories} freeDeliveryMin={storeConfig.free_delivery_min} />
        </div>
    )
}
