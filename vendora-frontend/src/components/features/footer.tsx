import Link from "next/link"
import { Leaf, Heart } from "lucide-react"

interface FooterProps {
    categories?: string[]
    freeDeliveryMin?: number
}

export function Footer({ categories = [], freeDeliveryMin = 499 }: FooterProps) {
    const trustItems = [
        { icon: "🌱", title: "100% Farm Fresh", desc: "Sourced directly from farmers" },
        { icon: "🚚", title: "Fast Delivery",    desc: `Free above ₹${freeDeliveryMin}` },
        { icon: "💳", title: "Secure Payments",  desc: "COD & online payments" },
        { icon: "♻️", title: "No Chemicals",     desc: "Natural & organic produce" },
    ]

    return (
        <footer className="bg-[#1B4332] text-white mt-16">
            {/* Trust bar */}
            <div className="border-b border-white/10">
                <div className="container px-4 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                        {trustItems.map(({ icon, title, desc }) => (
                            <div key={title} className="flex flex-col items-center gap-1.5">
                                <span className="text-2xl">{icon}</span>
                                <p className="font-semibold text-sm">{title}</p>
                                <p className="text-white/60 text-xs">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main footer */}
            <div className="container px-4 py-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                    {/* Brand */}
                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <div className="bg-[#F4845F] rounded-full p-1.5">
                                <Leaf className="h-4 w-4 text-white" />
                            </div>
                            <span className="font-bold text-lg">Vendora</span>
                        </div>
                        <p className="text-white/60 text-sm leading-relaxed">
                            Connecting farmers directly with consumers. Fresh, natural produce delivered from the farm to your table.
                        </p>
                    </div>

                    {/* Category links from API */}
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/70">Shop</h4>
                        <ul className="space-y-2.5 text-sm text-white/60">
                            <li>
                                <Link href="/products" className="hover:text-white transition-colors">All Products</Link>
                            </li>
                            {categories.map((cat) => (
                                <li key={cat}>
                                    <Link href={`/products?category=${encodeURIComponent(cat)}`} className="hover:text-white transition-colors capitalize">
                                        {cat}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Account links */}
                    <div>
                        <h4 className="font-semibold mb-4 text-sm uppercase tracking-wider text-white/70">Account</h4>
                        <ul className="space-y-2.5 text-sm text-white/60">
                            {[
                                { label: "Login",     href: "/login" },
                                { label: "Register",  href: "/register" },
                                { label: "My Orders", href: "/orders" },
                                { label: "Cart",      href: "/cart" },
                            ].map(({ label, href }) => (
                                <li key={label}>
                                    <Link href={href} className="hover:text-white transition-colors">{label}</Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>

            {/* Bottom bar */}
            <div className="border-t border-white/10">
                <div className="container px-4 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/40">
                    <p>© {new Date().getFullYear()} Vendora. All rights reserved.</p>
                    <p className="flex items-center gap-1">
                        Made with <Heart className="h-3 w-3 text-[#F4845F] fill-[#F4845F]" /> for farmers
                    </p>
                </div>
            </div>
        </footer>
    )
}
