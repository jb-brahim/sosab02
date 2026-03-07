"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Input } from "@/components/ui/input"
import {
    Package,
    Search,
    Loader2,
    HardHat,
    LayoutGrid,
    ListFilter
} from "lucide-react"
import api from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

interface MaterialSummary {
    materialId: string
    name: string
    unit: string
    stockQuantity: number
    projectName: string
    category: string
}

export default function GerantMaterialsPage() {
    const { user } = useAuth()
    const { t } = useLanguage()
    const [materials, setMaterials] = useState<MaterialSummary[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")

    useEffect(() => {
        const fetchMaterials = async () => {
            try {
                const res = await api.get('/materials/manager/summary')
                if (res.data.success) {
                    setMaterials(res.data.data)
                }
            } catch (error) {
                console.error("Failed to fetch materials summary", error)
            } finally {
                setLoading(false)
            }
        }

        if (user) {
            fetchMaterials()
        }
    }, [user])

    const filteredMaterials = materials.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.projectName.toLowerCase().includes(searchQuery.toLowerCase())
    )

    if (loading) {
        return (
            <div className="flex h-[80vh] items-center justify-center">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <HardHat className="h-6 w-6 text-primary animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("common.loading") || "Loading..."}</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background pb-24">
            {/* Header section with Search */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-xl font-display font-bold tracking-tight">{t("common.materials") || "Materials"}</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                                {t("stock.all_projects") || "Global Stock Summary"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder={t("common.search") || "Search materials or projects..."}
                        className="pl-10 h-11 bg-muted/50 border-white/10 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="p-4 space-y-4">
                {filteredMaterials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border-dashed">
                        <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground text-sm">{t("common.no_results") || "No materials found"}</p>
                    </div>
                ) : (
                    <div className="grid gap-3">
                        {filteredMaterials.map((material, index) => (
                            <div
                                key={`${material.materialId}-${index}`}
                                className="glass-card rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-all duration-200"
                            >
                                <div className="space-y-1 min-w-0 flex-1">
                                    <h3 className="font-bold text-sm truncate">{material.name}</h3>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/40" />
                                        <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider font-medium">
                                            {material.projectName}
                                        </p>
                                    </div>
                                </div>

                                <div className="text-right ml-4">
                                    <div className="flex items-baseline justify-end gap-1">
                                        <span className="text-lg font-display font-bold text-foreground tabular-nums">
                                            {material.stockQuantity}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
                                            {material.unit}
                                        </span>
                                    </div>
                                    <p className="text-[9px] text-muted-foreground uppercase">{material.category || "Consumable"}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
