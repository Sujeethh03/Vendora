import { getStoreConfig, getCategories } from "@/actions/store-actions"
import { Navbar } from "@/components/features/navbar"
import { Footer } from "@/components/features/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { StoreConfig } from "@/types"
import { config as appConfig } from "@/lib/config"

const API_URL = appConfig.api.publicBaseUrl

const CATEGORY_STYLES: Record<string, { bg: string; border: string; text: string; emoji: string }> = {
    vegetables: { bg: "bg-green-50",  border: "border-green-200",  text: "text-green-800",  emoji: "🥦" },
    fruits:     { bg: "bg-red-50",    border: "border-red-200",    text: "text-red-800",    emoji: "🍎" },
    grains:     { bg: "bg-amber-50",  border: "border-amber-200",  text: "text-amber-800",  emoji: "🌾" },
    dairy:      { bg: "bg-blue-50",   border: "border-blue-200",   text: "text-blue-800",   emoji: "🥛" },
    spices:     { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-800", emoji: "🌶️" },
    oils:       { bg: "bg-yellow-50", border: "border-yellow-200", text: "text-yellow-800", emoji: "🫙" },
    default:    { bg: "bg-gray-50",   border: "border-gray-200",   text: "text-gray-800",   emoji: "🛒" },
}

function getCategoryStyle(cat: string) {
    return CATEGORY_STYLES[cat.toLowerCase()] ?? CATEGORY_STYLES.default
}

function HeroSection({ config }: { config: StoreConfig }) {
    const tagline = config.hero_tagline ?? "Pure. Natural. Straight from the Farm."
    const description = config.hero_description ?? "Shop directly from local farmers. Fresh produce delivered to your door."

    return (
        <section className="relative bg-gradient-to-br from-[#1B4332] via-[#2D6A4F] to-[#40916c] text-white overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/3" />
            <div className="container px-4 py-14 md:py-20 relative z-10">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-5">
                        <span className="h-2 w-2 rounded-full bg-[#F4845F] animate-pulse" />
                        Farm fresh, delivered daily
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4">
                        {tagline.split(".").slice(0, 2).join(". ")}.<br />
                        <span className="text-[#F4845F]">{tagline.split(".").slice(2).join(".").trim()}</span>
                    </h1>
                    <p className="text-white/75 text-lg mb-8 leading-relaxed">{description}</p>
                    <div className="flex flex-wrap gap-3">
                        <Button asChild size="lg" className="bg-[#F4845F] hover:bg-[#e07050] text-white border-0 rounded-full px-8 font-semibold">
                            <Link href="/products">Shop Now</Link>
                        </Button>
                        <Button asChild size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/15 hover:text-white rounded-full px-8">
                            <Link href="/products?category=vegetables">Browse Vegetables</Link>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    )
}

export default async function HomePage() {
    const [storeConfig, categories] = await Promise.all([
        getStoreConfig(),
        getCategories(),
    ])

    const badges = storeConfig.trust_badges ?? [
        { icon: "🌱", text: "100% Farm Fresh" },
        { icon: "🚚", text: `Free Delivery above ₹${storeConfig.free_delivery_min}` },
        { icon: "💳", text: "COD & UPI Accepted" },
        { icon: "🔒", text: "Secure Checkout" },
        { icon: "♻️", text: "No Chemicals Added" },
    ]

    const banners = storeConfig.promo_banners ?? []

    return (
        <div className="min-h-screen bg-[#FAFAF2]">
            <Navbar />

            <HeroSection config={storeConfig} />

            {/* Trust badges */}
            <section className="bg-white border-b border-gray-100">
                <div className="container px-4 py-4">
                    <div className="flex flex-wrap justify-center md:justify-between gap-4 text-sm">
                        {badges.map(({ icon, text }) => (
                            <div key={text} className="flex items-center gap-2 text-gray-600 font-medium">
                                <span>{icon}</span>
                                <span>{text}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Promo banners */}
            {banners.length > 0 && (
                <section className="container px-4 py-10">
                    <div className={`grid grid-cols-1 gap-4 ${banners.length === 1 ? "" : banners.length >= 3 ? "md:grid-cols-3" : "md:grid-cols-2"}`}>
                        {banners.map((banner) => {
                            const isGreen = banner.color === "green"
                            const accentColor = isGreen ? "text-[#2D6A4F]" : "text-[#F4845F]"
                            const gradientClass = isGreen
                                ? "bg-gradient-to-r from-[#2D6A4F] to-[#40916c]"
                                : "bg-gradient-to-r from-[#F4845F] to-[#e8a87c]"

                            return banner.image_url ? (
                                <div key={banner.category} className="relative rounded-2xl overflow-hidden min-h-[260px]">
                                    <img
                                        src={`${API_URL}${banner.image_url}`}
                                        alt={banner.title}
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-r from-black/65 to-black/20" />
                                    <div className="relative p-7 flex flex-col justify-end h-full min-h-[260px]">
                                        <p className="text-xs font-semibold uppercase tracking-widest text-white/80 mb-1">{banner.subtitle}</p>
                                        <h3 className="text-xl font-bold text-white mb-1">{banner.title}</h3>
                                        <p className="text-white/75 text-sm mb-4">{banner.description}</p>
                                        <Link
                                            href={`/products?category=${encodeURIComponent(banner.category)}`}
                                            className={`inline-flex items-center gap-1.5 text-sm font-semibold bg-white px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors self-start ${accentColor}`}
                                        >
                                            Shop Now <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            ) : (
                                <div key={banner.category} className={`relative rounded-2xl p-7 text-white overflow-hidden min-h-[260px] flex flex-col justify-end ${gradientClass}`}>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 text-7xl opacity-20">
                                        {getCategoryStyle(banner.category).emoji}
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-widest text-white/70 mb-2">{banner.subtitle}</p>
                                    <h3 className="text-xl font-bold mb-1">{banner.title}</h3>
                                    <p className="text-white/70 text-sm mb-4">{banner.description}</p>
                                    <Link
                                        href={`/products?category=${encodeURIComponent(banner.category)}`}
                                        className={`inline-flex items-center gap-1.5 text-sm font-semibold bg-white px-4 py-1.5 rounded-full hover:bg-white/90 transition-colors ${accentColor}`}
                                    >
                                        Shop Now <ArrowRight className="h-3.5 w-3.5" />
                                    </Link>
                                </div>
                            )
                        })}
                    </div>
                </section>
            )}

            <Footer categories={categories} freeDeliveryMin={storeConfig.free_delivery_min} />
        </div>
    )
}
