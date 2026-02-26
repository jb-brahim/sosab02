"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
    Warehouse, Loader2, FileSpreadsheet,
    ChevronDown, ChevronRight, Plus, Minus, X, Check
} from "lucide-react"
import api, { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"
import { MATERIAL_CATALOG } from "@/lib/material-catalog"

// ── Types ─────────────────────────────────────────────────────────────────────
interface DbMaterial {
    _id: string
    name: string
    unit: string
    category: string
    stockQuantity: number
    totalIn: number
    totalOut: number
}

interface QuickLogState {
    materialName: string
    unit: string
    category: string
    type: "IN" | "OUT"
    value: string
}

export default function StockPage() {
    const router = useRouter()
    const { user } = useAuth()
    const { t } = useLanguage()

    const [projects, setProjects] = useState<any[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [dbMaterials, setDbMaterials] = useState<DbMaterial[]>([])
    const [loading, setLoading] = useState(false)
    const [loadingProjects, setLoadingProjects] = useState(true)
    const [isExporting, setIsExporting] = useState(false)
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
    const [quickLog, setQuickLog] = useState<QuickLogState | null>(null)
    const [submitting, setSubmitting] = useState(false)

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
                    if (res.data.data.length > 0) setSelectedProjectId(res.data.data[0]._id)
                }
            } catch { toast.error("Failed to load projects") }
            finally { setLoadingProjects(false) }
        }
        fetchProjects()
    }, [])

    // Fetch DB materials when project changes
    const fetchMaterials = useCallback(async () => {
        if (!selectedProjectId) return
        try {
            setLoading(true)
            setExpandedGroups(new Set())
            const res = await api.get(`/materials/${selectedProjectId}`)
            if (res.data.success) setDbMaterials(res.data.data)
        } catch { toast.error("Failed to load materials") }
        finally { setLoading(false) }
    }, [selectedProjectId])

    useEffect(() => { fetchMaterials() }, [fetchMaterials])

    // Build a lookup: materialName → db record
    const dbMap = new Map<string, DbMaterial>()
    dbMaterials.forEach(m => dbMap.set(m.name.toLowerCase(), m))

    // All catalog item names (lowercase) for exclusion check
    const catalogNames = new Set(
        MATERIAL_CATALOG.flatMap(g => g.items.map(i => i.name.toLowerCase()))
    )

    // DB materials that are NOT in the catalog at all
    const uncategorizedMaterials = dbMaterials.filter(
        m => !catalogNames.has(m.name.toLowerCase()) && (m.totalIn > 0 || m.totalOut > 0 || m.stockQuantity > 0)
    )

    // Export Excel
    const handleExportExcel = async () => {
        if (!selectedProjectId) return
        try {
            setIsExporting(true)
            const now = new Date()
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
            const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0]
            const res = await api.post('/reports/generate', {
                projectId: selectedProjectId, type: 'material',
                startDate: startOfMonth, endDate: endOfMonth, format: 'excel'
            })
            if (res.data.success) {
                toast.success("Excel generated!")
                window.open(`${BACKEND_URL}${res.data.data.pdfUrl}`, '_blank')
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Export failed")
        } finally { setIsExporting(false) }
    }

    // Toggle group open/close
    const toggleGroup = (cls: string) => {
        setExpandedGroups(prev => {
            const next = new Set(prev)
            next.has(cls) ? next.delete(cls) : next.add(cls)
            return next
        })
    }

    // Open the quick quantity input for +/-
    const openQuickLog = (
        materialName: string, unit: string, category: string, type: "IN" | "OUT",
        e: React.MouseEvent
    ) => {
        e.stopPropagation()
        setQuickLog({ materialName, unit, category, type, value: "" })
    }

    // Submit quick IN / OUT
    const submitQuickLog = async () => {
        if (!quickLog || !quickLog.value || !selectedProjectId) return
        const qty = parseFloat(quickLog.value)
        if (isNaN(qty) || qty <= 0) { toast.error("Enter a valid quantity"); return }
        try {
            setSubmitting(true)
            await api.post("/materials/quick-log", {
                projectId: selectedProjectId,
                materialName: quickLog.materialName,
                unit: quickLog.unit,
                category: quickLog.category,
                quantity: qty,
                type: quickLog.type
            })
            toast.success(`${quickLog.type === "IN" ? "+" : "-"}${qty} ${quickLog.unit} — ${quickLog.materialName}`)
            setQuickLog(null)
            await fetchMaterials()
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to log")
        } finally { setSubmitting(false) }
    }

    const selectedProject = projects.find(p => p._id === selectedProjectId)

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-20">
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
                            {selectedProject?.name || t("stock.subtitle") || "Material stock levels"}
                        </p>
                    </div>
                </div>
            </div>

            <div className="p-4 relative z-10 space-y-3">
                {/* Project Selector & Export Button */}
                <div className="flex items-end gap-3">
                    <div className="glass-card rounded-2xl p-4 flex-1">
                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-2 block">
                            {t("stock.select_project") || "Select Project"}
                        </label>
                        {loadingProjects ? (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" /><span>Loading...</span>
                            </div>
                        ) : (
                            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                                <SelectTrigger className="w-full bg-background/50 border-white/10">
                                    <SelectValue placeholder="Select a project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    {selectedProjectId && (
                        <Button
                            onClick={handleExportExcel}
                            disabled={isExporting || loading}
                            variant="outline"
                            className="glass-card border-primary/20 hover:bg-primary/5 text-primary rounded-2xl h-[72px] w-14 flex items-center justify-center p-0 flex-shrink-0"
                        >
                            {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <FileSpreadsheet className="w-5 h-5" />}
                        </Button>
                    )}
                </div>

                {/* Quick-log overlay */}
                {quickLog && (
                    <div className="fixed inset-0 z-50 flex items-end justify-center pb-8 px-4"
                        style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                        onClick={() => setQuickLog(null)}>
                        <div className="glass-card rounded-2xl w-full max-w-sm p-5 space-y-4 border border-white/10"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`text-xs font-bold uppercase tracking-wider ${quickLog.type === "IN" ? "text-green-500" : "text-red-400"}`}>
                                        {quickLog.type === "IN" ? "+ Arrival (IN)" : "- Sortie (OUT)"}
                                    </p>
                                    <p className="font-semibold text-sm mt-0.5 truncate">{quickLog.materialName}</p>
                                </div>
                                <button onClick={() => setQuickLog(null)} className="p-1 rounded-lg hover:bg-white/10">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    type="number"
                                    min="0"
                                    step="any"
                                    placeholder={`Quantity (${quickLog.unit})`}
                                    value={quickLog.value}
                                    onChange={e => setQuickLog({ ...quickLog, value: e.target.value })}
                                    autoFocus
                                    className="flex-1"
                                    onKeyDown={e => e.key === "Enter" && submitQuickLog()}
                                />
                                <Button
                                    onClick={submitQuickLog}
                                    disabled={submitting || !quickLog.value}
                                    className={quickLog.type === "IN" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Catalog Groups */}
                {selectedProjectId && (
                    loading ? (
                        <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground text-sm glass-card rounded-2xl">
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>{t("stock.loading") || "Loading stock..."}</span>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {MATERIAL_CATALOG.map(group => {
                                const isExpanded = expandedGroups.has(group.classification)

                                // Compute group stats
                                const groupBalance = group.items.reduce((sum, item) => {
                                    const db = dbMap.get(item.name.toLowerCase())
                                    return sum + (db ? db.stockQuantity : 0)
                                }, 0)

                                return (
                                    <div key={group.classification} className="glass-card rounded-2xl overflow-hidden">
                                        {/* Group header */}
                                        <button
                                            type="button"
                                            onClick={() => toggleGroup(group.classification)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                                                    <span className="text-[10px] font-black text-primary uppercase">
                                                        {group.classification.charAt(0)}
                                                    </span>
                                                </div>
                                                <div className="text-left">
                                                    <p className="text-sm font-bold uppercase tracking-wide">{group.classification}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium">
                                                        {group.items.length} items
                                                        {groupBalance > 0 && (
                                                            <span className="ml-2 text-green-500 font-bold">• {groupBalance} in stock</span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                            {isExpanded
                                                ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                                : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            }
                                        </button>

                                        {/* Items */}
                                        {isExpanded && (
                                            <div className="border-t border-white/5">
                                                {/* Column headers */}
                                                <div className="grid grid-cols-12 px-4 py-2 bg-black/10">
                                                    <span className="col-span-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Material</span>
                                                    <span className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Unit</span>
                                                    <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-green-500/70 text-center">IN</span>
                                                    <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-red-500/70 text-center">OUT</span>
                                                    <span className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">=</span>
                                                </div>

                                                <div className="divide-y divide-white/5">
                                                    {group.items.map((item, i) => {
                                                        const db = dbMap.get(item.name.toLowerCase())
                                                        const totalIn = db?.totalIn ?? 0
                                                        const totalOut = db?.totalOut ?? 0
                                                        const balance = Math.max(0, totalIn - totalOut)
                                                        const isOut = balance === 0
                                                        const isLow = balance > 0 && balance <= 5

                                                        return (
                                                            <div
                                                                key={i}
                                                                className={`grid grid-cols-12 items-center px-3 py-2.5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-black/10'}`}
                                                            >
                                                                {/* Name */}
                                                                <div className="col-span-6 flex items-start gap-1.5 min-w-0 pt-0.5">
                                                                    <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${db ? (isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500') : 'bg-white/20'}`} />
                                                                    <span className="text-xs font-medium leading-tight">{item.name}</span>
                                                                </div>
                                                                {/* Unit */}
                                                                <div className="col-span-1 text-center">
                                                                    <span className="text-[10px] text-muted-foreground font-bold uppercase">{item.unit}</span>
                                                                </div>
                                                                {/* IN */}
                                                                <div className="col-span-2 flex items-center justify-center">
                                                                    <button
                                                                        onClick={e => openQuickLog(item.name, item.unit, group.classification, "IN", e)}
                                                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-green-500/20 transition-colors group/in"
                                                                    >
                                                                        <Plus className="w-3 h-3 text-green-500 opacity-60 group-hover/in:opacity-100" />
                                                                        <span className="text-xs font-semibold tabular-nums text-green-500">{totalIn}</span>
                                                                    </button>
                                                                </div>
                                                                {/* OUT */}
                                                                <div className="col-span-2 flex items-center justify-center">
                                                                    <button
                                                                        onClick={e => openQuickLog(item.name, item.unit, group.classification, "OUT", e)}
                                                                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-red-500/20 transition-colors group/out"
                                                                    >
                                                                        <Minus className="w-3 h-3 text-red-400 opacity-60 group-hover/out:opacity-100" />
                                                                        <span className="text-xs font-semibold tabular-nums text-red-400">{totalOut}</span>
                                                                    </button>
                                                                </div>
                                                                {/* Balance */}
                                                                <div className="col-span-1 text-right pr-1">
                                                                    <span className={`text-sm font-bold tabular-nums ${!db ? 'text-muted-foreground/40' : isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-foreground'}`}>
                                                                        {balance}
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
                            })}

                            {/* ── Uncategorized / Custom materials ── */}
                            {uncategorizedMaterials.length > 0 && (
                                <div className="glass-card rounded-2xl overflow-hidden">
                                    <button
                                        type="button"
                                        onClick={() => toggleGroup('__autres__')}
                                        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 flex-shrink-0">
                                                <span className="text-[10px] font-black text-amber-500 uppercase">A</span>
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-bold uppercase tracking-wide">Autres (Personnalisés)</p>
                                                <p className="text-[10px] text-muted-foreground font-medium">
                                                    {uncategorizedMaterials.length} items
                                                    <span className="ml-2 text-amber-500 font-bold">
                                                        • {uncategorizedMaterials.reduce((s, m) => s + m.stockQuantity, 0)} in stock
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                        {expandedGroups.has('__autres__')
                                            ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                            : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                                        }
                                    </button>

                                    {expandedGroups.has('__autres__') && (
                                        <div className="border-t border-white/5">
                                            <div className="grid grid-cols-12 px-4 py-2 bg-black/10">
                                                <span className="col-span-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Material</span>
                                                <span className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Unit</span>
                                                <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-green-500/70 text-center">IN</span>
                                                <span className="col-span-2 text-[10px] font-bold uppercase tracking-wider text-red-500/70 text-center">OUT</span>
                                                <span className="col-span-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">=</span>
                                            </div>
                                            <div className="divide-y divide-white/5">
                                                {uncategorizedMaterials.map((m, i) => {
                                                    const balance = Math.max(0, (m.totalIn ?? 0) - (m.totalOut ?? 0))
                                                    const isOut = balance === 0
                                                    const isLow = balance > 0 && balance <= 5
                                                    return (
                                                        <div key={m._id} className={`grid grid-cols-12 items-center px-3 py-2.5 hover:bg-white/5 transition-colors ${i % 2 === 0 ? '' : 'bg-black/10'}`}>
                                                            <div className="col-span-6 flex items-start gap-1.5 min-w-0 pt-0.5">
                                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5 ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`} />
                                                                <span className="text-xs font-medium leading-tight">{m.name}</span>
                                                            </div>
                                                            <div className="col-span-1 text-center">
                                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">{m.unit}</span>
                                                            </div>
                                                            <div className="col-span-2 flex items-center justify-center">
                                                                <button
                                                                    onClick={e => openQuickLog(m.name, m.unit, m.category || 'Autre', "IN", e)}
                                                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-green-500/20 transition-colors group/in"
                                                                >
                                                                    <Plus className="w-3 h-3 text-green-500 opacity-60 group-hover/in:opacity-100" />
                                                                    <span className="text-xs font-semibold tabular-nums text-green-500">{m.totalIn ?? 0}</span>
                                                                </button>
                                                            </div>
                                                            <div className="col-span-2 flex items-center justify-center">
                                                                <button
                                                                    onClick={e => openQuickLog(m.name, m.unit, m.category || 'Autre', "OUT", e)}
                                                                    className="flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-red-500/20 transition-colors group/out"
                                                                >
                                                                    <Minus className="w-3 h-3 text-red-400 opacity-60 group-hover/out:opacity-100" />
                                                                    <span className="text-xs font-semibold tabular-nums text-red-400">{m.totalOut ?? 0}</span>
                                                                </button>
                                                            </div>
                                                            <div className="col-span-1 text-right pr-1">
                                                                <span className={`text-sm font-bold tabular-nums ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-foreground'}`}>
                                                                    {balance}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )
                                                })}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Legend */}
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
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Empty</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-white/20" />
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Never used</span>
                                </div>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    )
}
