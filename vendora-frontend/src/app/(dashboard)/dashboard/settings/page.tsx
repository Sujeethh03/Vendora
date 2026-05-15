"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { Loader2, ImagePlus, Save, Plus, Trash2, ChevronUp, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { getStoreConfig, updateStoreConfig, uploadBannerImage } from "@/actions/store-actions"
import { config as appConfig } from "@/lib/config"
import type { PromoBanner } from "@/types"

const API_URL = appConfig.api.publicBaseUrl

const COLORS = [
    { value: "green",  label: "Green",  dot: "bg-[#2D6A4F]" },
    { value: "orange", label: "Orange", dot: "bg-[#F4845F]" },
]

const EMPTY_BANNER: PromoBanner = {
    subtitle: "",
    title: "",
    description: "",
    category: "",
    color: "green",
    image_url: null,
}

function BannerEditor({
    index,
    total,
    banner,
    onChange,
    onRemove,
    onMoveUp,
    onMoveDown,
}: {
    index: number
    total: number
    banner: PromoBanner
    onChange: (b: PromoBanner) => void
    onRemove: () => void
    onMoveUp: () => void
    onMoveDown: () => void
}) {
    const [uploading, setUploading] = useState(false)
    const fileRef = useRef<HTMLInputElement>(null)

    const set = (field: keyof PromoBanner, value: string | null) =>
        onChange({ ...banner, [field]: value })

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setUploading(true)
        const fd = new FormData()
        fd.append("file", file)
        const result = await uploadBannerImage(index, fd)
        if (result.success) {
            toast.success("Image uploaded")
            const fresh = await getStoreConfig()
            const freshBanner = fresh.promo_banners?.[index]
            if (freshBanner) onChange(freshBanner)
        } else {
            toast.error(result.error || "Upload failed")
        }
        setUploading(false)
        if (fileRef.current) fileRef.current.value = ""
    }

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                        Banner {index + 1}
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveUp} disabled={index === 0} title="Move up">
                            <ChevronUp className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onMoveDown} disabled={index === total - 1} title="Move down">
                            <ChevronDown className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={onRemove} title="Remove banner">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Image upload */}
                <div>
                    <Label className="mb-2 block">Banner Image</Label>
                    {banner.image_url ? (
                        <div className="relative rounded-lg overflow-hidden h-36 bg-muted group cursor-pointer" onClick={() => fileRef.current?.click()}>
                            <img src={`${API_URL}${banner.image_url}`} alt="Banner" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-sm font-medium">
                                <ImagePlus className="h-4 w-4" /> Change Image
                            </div>
                        </div>
                    ) : (
                        <div
                            onClick={() => fileRef.current?.click()}
                            className="border-2 border-dashed rounded-lg h-36 flex flex-col items-center justify-center gap-2 text-muted-foreground cursor-pointer hover:border-primary/50 transition-colors"
                        >
                            {uploading
                                ? <Loader2 className="h-6 w-6 animate-spin" />
                                : <>
                                    <ImagePlus className="h-6 w-6" />
                                    <p className="text-sm">Click to upload image</p>
                                    <p className="text-xs">JPEG, PNG, WebP</p>
                                </>
                            }
                        </div>
                    )}
                    <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />
                </div>

                {/* Text fields */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <Label>Subtitle</Label>
                        <Input value={banner.subtitle} onChange={e => set("subtitle", e.target.value)} placeholder="e.g. Fresh Daily" />
                    </div>
                    <div className="space-y-1">
                        <Label>Category link</Label>
                        <Input value={banner.category} onChange={e => set("category", e.target.value)} placeholder="e.g. vegetables" />
                    </div>
                </div>

                <div className="space-y-1">
                    <Label>Title</Label>
                    <Input value={banner.title} onChange={e => set("title", e.target.value)} placeholder="e.g. Farm Vegetables" />
                </div>

                <div className="space-y-1">
                    <Label>Description</Label>
                    <Textarea value={banner.description} onChange={e => set("description", e.target.value)} placeholder="Short tagline..." rows={2} />
                </div>

                <div className="space-y-2">
                    <Label>Fallback Color <span className="text-muted-foreground font-normal text-xs">(when no image)</span></Label>
                    <div className="flex gap-2">
                        {COLORS.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => set("color", c.value)}
                                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border-2 transition-all ${banner.color === c.value ? "border-foreground font-medium" : "border-transparent text-muted-foreground"}`}
                            >
                                <span className={`h-3 w-3 rounded-full ${c.dot}`} />
                                {c.label}
                            </button>
                        ))}
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

export default function SettingsPage() {
    const [loading, setLoading]     = useState(true)
    const [saving, setSaving]       = useState(false)
    const [storeName, setStoreName] = useState("")
    const [announcement, setAnnouncement] = useState("")
    const [banners, setBanners]     = useState<PromoBanner[]>([])

    useEffect(() => {
        getStoreConfig().then(cfg => {
            setStoreName(cfg.store_name)
            setAnnouncement(cfg.announcement_text ?? "")
            setBanners(cfg.promo_banners ?? [])
            setLoading(false)
        })
    }, [])

    function updateBanner(index: number, b: PromoBanner) {
        setBanners(prev => prev.map((old, i) => i === index ? b : old))
    }

    function addBanner() {
        setBanners(prev => [...prev, { ...EMPTY_BANNER }])
    }

    function removeBanner(index: number) {
        setBanners(prev => prev.filter((_, i) => i !== index))
    }

    function moveBanner(index: number, direction: "up" | "down") {
        setBanners(prev => {
            const next = [...prev]
            const swap = direction === "up" ? index - 1 : index + 1
            ;[next[index], next[swap]] = [next[swap], next[index]]
            return next
        })
    }

    async function handleSave() {
        setSaving(true)
        const result = await updateStoreConfig({
            store_name: storeName,
            announcement_text: announcement || null,
            promo_banners: banners,
        })
        if (result.success) {
            toast.success("Settings saved")
        } else {
            toast.error(result.error || "Failed to save")
        }
        setSaving(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="space-y-8 max-w-3xl">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Store Settings</h1>
                    <p className="text-muted-foreground">Manage your store appearance and homepage banners</p>
                </div>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Changes
                </Button>
            </div>

            {/* Store info */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-base">Store Information</CardTitle>
                    <CardDescription>Shown in the navbar and announcement bar</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label>Store Name</Label>
                        <Input value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="Vendora" />
                    </div>
                    <div className="space-y-1">
                        <Label>Announcement Bar</Label>
                        <Input
                            value={announcement}
                            onChange={e => setAnnouncement(e.target.value)}
                            placeholder="🌿 Fresh from the farm · Free delivery on orders above ₹499"
                        />
                        <p className="text-xs text-muted-foreground">Leave empty to hide the announcement bar</p>
                    </div>
                </CardContent>
            </Card>

            {/* Promo banners */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold">Promo Banners</h2>
                        <p className="text-sm text-muted-foreground">Add as many banners as you like — they appear in a grid on the homepage.</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={addBanner} className="gap-2">
                        <Plus className="h-4 w-4" /> Add Banner
                    </Button>
                </div>

                {banners.length === 0 ? (
                    <div className="border-2 border-dashed rounded-xl p-10 text-center text-muted-foreground">
                        <p className="font-medium mb-1">No banners yet</p>
                        <p className="text-sm mb-4">Click "Add Banner" to create your first promo banner</p>
                        <Button variant="outline" size="sm" onClick={addBanner} className="gap-2">
                            <Plus className="h-4 w-4" /> Add Banner
                        </Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {banners.map((banner, i) => (
                            <BannerEditor
                                key={i}
                                index={i}
                                total={banners.length}
                                banner={banner}
                                onChange={b => updateBanner(i, b)}
                                onRemove={() => removeBanner(i)}
                                onMoveUp={() => moveBanner(i, "up")}
                                onMoveDown={() => moveBanner(i, "down")}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
