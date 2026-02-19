"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Warehouse, Package, Loader2, FileSpreadsheet, ChevronDown, ChevronRight } from "lucide-react"
import api, { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { MATERIAL_CATALOG } from "@/lib/material-catalog"

export default function StockPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useLanguage()

    const [projects, setProjects] = useState<any[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingProjects, setLoadingProjects] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

    // Redirect non-managers
    useEffect(() => {
        if (user && user.role !== "pm" && user.role !== "admin") {
            router.replace("/app")
        }
    }, [user, router])

    // Fetch projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get("/projects")
                if (res.data.success) {
                    setProjects(res.data.data)
                    if (res.data.data.length > 0) {
                        setSelectedProjectId(res.data.data[0]._id)
                    }
                }
            } catch {
                toast.error("Failed to load projects")
            } finally {
                setLoadingProjects(false)
            }
        }
        fetchProjects()
    }, [])

    // Fetch materials when project changes
    useEffect(() => {
        if (!selectedProjectId) return
        const fetchMaterials = async () => {
            try {
                setLoading(true)
                setExpandedGroups(new Set()) // collapse all on project change
                const res = await api.get(`/materials/${selectedProjectId}`)
                if (res.data.success) {
                    setMaterials(res.data.data)
                }
            } catch {
                toast.error("Failed to load materials")
            } finally {
                setLoading(false)
            }
        }
        fetchMaterials()
    }, [selectedProjectId])

    const handleExportExcel = async () => {
        if (!selectedProjectId) return
        try {
            setIsExporting(true)
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
            const res = await api.post('/reports/generate', {
                projectId: selectedProjectId,
                type: 'material',
                startDate: startOfMonth,
                endDate: endOfMonth,
                format: 'excel'
            })
            if (res.data.success) {
                toast.success(t("materials.arrival_success") || "Excel generated!")
                const downloadUrl = `${BACKEND_URL}${res.data.data.pdfUrl}`
                window.open(downloadUrl, '_blank')
            }
        } catch (error: any) {
            console.error("Export failed", error)
            toast.error(error.response?.data?.message || "Export failed")
        } finally {
            setIsExporting(false)
        }
    }

    const toggleGroup = (classification: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            if (next.has(classification)) {
                next.delete(classification)
            } else {
                next.add(classification)
            }
            return next
        })
    }

    const selectedProject = projects.find(p => p._id === selectedProjectId)

    // Group materials by their category (classification), using the catalog order
    // Also collect uncategorized materials
    const grouped: { classification: string; items: any[] }[] = []

    // First, build groups in catalog order
    MATERIAL_CATALOG.forEach(cat => {
        const items = materials.filter(
            m => (m.category || "").toUpperCase() === cat.classification.toUpperCase()
        )
        if (items.length > 0) {
            grouped.push({ classification: cat.classification, items })
        }
    })

    // Any uncategorized or custom category
    const knownCategories = new Set(MATERIAL_CATALOG.map(c => c.classification.toUpperCase()))
    const uncategorized = materials.filter(
        m => !knownCategories.has((m.category || "").toUpperCase())
    )
    // Group uncategorized by their actual category value
    const otherGroups: Record<string, any[]> = {}
    uncategorized.forEach(m => {
        const key = m.category || "Autres"
        if (!otherGroups[key]) otherGroups[key] = []
        otherGroups[key].push(m)
    })
    Object.entries(otherGroups).forEach(([key, items]) => {
        grouped.push({ classification: key, items })
    })

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-20">
            {/* Decorative background */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/5 bg-background/80 p-4 backdrop-blur-md">
                <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                        <Warehouse className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-display font-bold tracking-tight">{t("stock.title") || "Stock"}</h1>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                            {t("stock.subtitle") || "Material stock levels per project"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 relative z-10 space-y-4">
                {/* Project Selector */}
                <div className="glass-card rounded-2xl p-4">
                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 block">
                        {t("stock.select_project") || "Select Project"}
                    </label>
                    {loadingProjects ? (
                        <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Loading projects...</span>
                        </div>
                    ) : (
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                            <SelectTrigger className="w-full bg-background/50 border-white/10 focus:ring-primary/50">
                                <SelectValue placeholder={t("stock.select_project") || "Select a project"} />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>

                {/* Export Button */}
                {selectedProjectId && (
                    <Button
                        onClick={handleExportExcel}
                        disabled={isExporting || loading}
                        variant="outline"
                        className="w-full glass-card border-primary/20 hover:bg-primary/5 text-primary rounded-2xl h-12 flex items-center justify-center gap-2"
                    >
                        {isExporting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="w-4 h-4" />
                        )}
                        <span className="font-bold uppercase tracking-wider text-xs">
                            {t("stock.excel_export") || "Export Excel"}
                        </span>
                    </Button>
                )}

                {/* Grouped Stock View */}
                {selectedProjectId && (
                    <div className="space-y-2">
                        {/* Section title */}
                        <div className="flex items-center justify-between px-1">
                            <div className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/80">
                                    {selectedProject?.name || "Project Stock"}
                                </span>
                            </div>
                            <span className="text-[10px] text-muted-foreground font-medium">
                                {materials.length} {materials.length === 1 ? "item" : "items"}
                            </span>
                        </div>

                        {loading ? (
                            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground text-sm glass-card rounded-2xl">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t("stock.loading") || "Loading stock..."}</span>
                            </div>
                        ) : materials.length === 0 ? (
                            <div className="glass-card rounded-2xl p-8 text-center text-muted-foreground text-sm">
                                {t("stock.no_materials") || "No materials found for this project."}
                            </div>
                        ) : (
                            grouped.map(group => {
                                const isExpanded = expandedGroups.has(group.classification)
                                return (
                                    <div key={group.classification} className="glass-card rounded-2xl overflow-hidden">
                                        {/* Group Header — clickable */}
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group.classification)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                                                    <Package className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold uppercase tracking-wide">
                                                        {group.classification}
                                                    </p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        {group.items.length} {group.items.length === 1 ? "item" : "items"}
                                                    </p>
                                                </div>
                                            </div>
                                            {isExpanded
                                                ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            }
                                        </button>

                                        {/* Items inside group */}
                                        {isExpanded && (
                                            <div className="border-t border-white/5">
                                                {/* Column headers */}
                                                <div className="grid grid-cols-12 px-4 py-2 bg-black/10">
                                                    <span className="col-span-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                                        {t("stock.material") || "Material"}
                                                    </span>
                                                    <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                                                        {t("stock.unit") || "Unit"}
                                                    </span>
                                                    <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-green-500/70 text-center">IN</span>
                                                    <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-red-500/70 text-center">OUT</span>
                                                    <span className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">=</span>
                                                </div>

                                                {/* Rows */}
                                                <div className="divide-y divide-white/5">
                                                    {group.items.map((mat: any, i: number) => {
                                                        const totalIn = mat.totalIn ?? 0
                                                        const totalOut = mat.totalOut ?? 0
                                                        const computed = Math.max(0, totalIn - totalOut)
                                                        const isLow = computed <= 5
                                                        const isOut = computed === 0
                                                        return (
                                                            <div
                                                                key={mat._id}
                                                                className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-black/10'}`}
                                                            >
                                                                <div className="col-span-5 flex items-center gap-2">
                                                                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`} />
                                                                    <span className="font-medium text-sm truncate">{mat.name}</span>
                                                                </div>
                                                                <div className="col-span-2 text-center">
                                                                    <span className="text-xs text-muted-foreground font-medium uppercase">{mat.unit}</span>
                                                                </div>
                                                                <div className="col-span-2 text-center">
                                                                    <span className="text-xs font-semibold tabular-nums text-green-500">+{totalIn}</span>
                                                                </div>
                                                                <div className="col-span-2 text-center">
                                                                    <span className="text-xs font-semibold tabular-nums text-red-400">-{totalOut}</span>
                                                                </div>
                                                                <div className="col-span-1 text-right">
                                                                    <span className={`text-sm font-bold tabular-nums ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-foreground'}`}>
                                                                        {computed}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })
                        )}

                        {/* Legend */}
                        {materials.length > 0 && (
                            <div className="px-2 py-2 flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">In Stock</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Low (≤5)</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-red-500" />
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Out</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
