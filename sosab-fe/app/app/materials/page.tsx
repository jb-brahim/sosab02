"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Package, Search, ArrowDownLeft, Box, Filter } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"

export default function MaterialsPage() {
    const router = useRouter()
    const { t } = useLanguage()
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                setLoading(true)
                const res = await api.get('/materials/manager/summary')
                if (res.data.success) {
                    setMaterials(res.data.data)
                }
            } catch (error) {
                console.error("Failed to load materials", error)
                toast.error("Failed to load material data")
            } finally {
                setLoading(false)
            }
        }
        fetchSummary()
    }, [])

    const filteredMaterials = materials
        .filter(item => item.supplier.toLowerCase().includes(searchQuery.toLowerCase()) || item.name.toLowerCase().includes(searchQuery.toLowerCase()))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-24 gpu">
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/2 rounded-full blur-2xl pointer-events-none -translate-y-1/2 translate-x-1/2" />

            <div className="p-4 space-y-6 relative z-10">
                {/* Header */}
                <div className="flex flex-col gap-2 pt-2 animate-in">
                    <h1 className="font-display text-3xl font-bold flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/20">
                            <Package className="w-5 h-5 text-primary-foreground" />
                        </div>
                        {t("materials.global_inventory")}
                    </h1>
                    <p className="text-muted-foreground text-sm font-medium ml-1">{t("materials.track_materials")}</p>
                </div>

                {/* Search Bar */}
                <div className="relative animate-in delay-100">
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                        <Search className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <input
                        type="text"
                        placeholder={t("materials.search_placeholder") || "Search materials or suppliers..."}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 pl-10 pr-4 rounded-xl bg-card/40 backdrop-blur-md border border-white/10 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-transparent transition-all shadow-sm placeholder:text-muted-foreground/50"
                    />
                    <div className="absolute inset-y-0 right-3 flex items-center">
                        <div className="bg-white/5 p-1.5 rounded-md">
                            <Filter className="w-3 h-3 text-muted-foreground" />
                        </div>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center justify-between px-1 animate-in delay-200">
                    <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary glow-primary"></span>
                        <span className="text-xs font-bold uppercase tracking-widest text-foreground/80">{t("materials.stock_items")}</span>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/10 shadow-none">
                        {filteredMaterials.length} {t("materials.results")}
                    </Badge>
                </div>

                {/* Materials Grid */}
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground animate-pulse">
                        <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                        <span className="text-xs font-bold uppercase tracking-widest">{t("materials.loading_inventory")}</span>
                    </div>
                ) : filteredMaterials.length === 0 ? (
                    <div className="glass-card rounded-2xl border-dashed border-2 border-white/10 py-12 text-center animate-in delay-300">
                        <Package className="w-12 h-12 mx-auto mb-3 text-muted-foreground/30" />
                        <p className="text-muted-foreground font-medium">{t("materials.no_materials")}</p>
                        <p className="text-xs text-muted-foreground/50 mt-1">{t("materials.adjust_search")}</p>
                    </div>
                ) : (
                    <div className="grid gap-3 animate-in delay-300" style={{ contentVisibility: 'auto' } as any}>
                        {filteredMaterials.map((item, index) => (
                            <div
                                key={item.materialId}
                                className="glass-card rounded-xl p-0 overflow-hidden relative cursor-pointer group active:scale-[0.98] transition-transform gpu will-change-transform"
                                onClick={() => router.push(`/app/materials/${item.materialId}`)}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                        <div className="space-y-1">
                                            <div className="font-display font-bold text-lg leading-none group-hover:text-primary transition-colors">{item.name}</div>
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                <Badge variant="secondary" className="bg-white/5 text-[9px] uppercase font-bold text-muted-foreground border-white/5 px-1.5 h-5 hover:bg-white/10">
                                                    {item.projectName}
                                                </Badge>
                                                <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground border-white/10 px-1.5 h-5">
                                                    {item.supplier}
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-black/20 rounded-lg p-2.5 flex items-center justify-between border border-white/5 group-hover:border-primary/20 transition-colors">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] uppercase font-black text-white/40 tracking-wider flex items-center gap-1">
                                                <ArrowDownLeft className="w-3 h-3 text-green-500" /> {t("materials.total_received")}
                                            </span>
                                            <span className="text-lg font-display font-bold text-foreground">
                                                {item.totalIn} <span className="text-[10px] opacity-50 ml-0.5">{item.unit}</span>
                                            </span>
                                        </div>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Box className="w-4 h-4 text-primary opacity-80" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
