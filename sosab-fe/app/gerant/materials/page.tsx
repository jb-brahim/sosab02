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
        <div className="min-h-screen bg-background pb-24 w-full overflow-x-hidden">
            {/* Header section with Search */}
            <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-md border-b border-white/5 p-4 space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 shrink-0">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <h1 className="text-xl font-display font-bold tracking-tight truncate">Matériaux</h1>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold truncate">
                                {t("stock.all_projects") || "Récapitulatif Stock Global"}
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Rechercher matériel ou chantier..."
                        className="pl-10 h-11 bg-muted/50 border-white/10 rounded-xl"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            <div className="p-4 space-y-4 w-full">
                {filteredMaterials.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center glass rounded-2xl border-dashed">
                        <Package className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <p className="text-muted-foreground text-sm">{t("common.no_results") || "Aucun matériel trouvé"}</p>
                    </div>
                ) : (
                    <div className="grid gap-3 w-full">
                        {filteredMaterials.map((material, index) => (
                            <div
                                key={`${material.materialId}-${index}`}
                                className="glass-card rounded-2xl p-3.5 sm:p-4 flex items-center justify-between gap-2.5 sm:gap-3 w-full overflow-hidden group active:scale-[0.98] transition-all duration-200 border border-white/5 hover:border-primary/20"
                            >
                                <div className="space-y-1 min-w-0 flex-1 overflow-hidden">
                                    <h3 className="font-bold text-sm text-foreground truncate min-w-0">{material.name}</h3>
                                    <div className="flex items-center gap-1.5 min-w-0 w-full overflow-hidden">
                                        <div className="h-1.5 w-1.5 rounded-full bg-primary/60 shrink-0" />
                                        <p className="text-[11px] text-muted-foreground truncate uppercase tracking-wider font-medium min-w-0 flex-1">
                                            {material.projectName}
                                        </p>
                                    </div>
                                    <div className="pt-0.5 flex items-center">
                                        <span className="inline-block text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-white/5 truncate max-w-full">
                                            {material.category || "Consommable"}
                                        </span>
                                    </div>
                                </div>

                                <div className="shrink-0 text-right flex flex-col items-end justify-center pl-1">
                                    <div className="bg-primary/10 border border-primary/20 rounded-xl px-2.5 sm:px-3 py-1.5 flex items-baseline gap-1 text-primary shadow-sm whitespace-nowrap">
                                        <span className="text-base sm:text-lg font-display font-black tabular-nums leading-none">
                                            {material.stockQuantity ?? 0}
                                        </span>
                                        <span className="text-[10px] font-bold uppercase tracking-tight opacity-90">
                                            {material.unit || "U"}
                                        </span>
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
