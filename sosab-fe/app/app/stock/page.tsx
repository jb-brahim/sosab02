"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Warehouse, Package, ArrowDownLeft, ArrowUpRight, Loader2, FileSpreadsheet, Download as DownloadIcon } from "lucide-react"
import api, { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"
import { useLanguage } from "@/lib/language-context"

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

            // Generate report for current month by default
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

    const selectedProject = projects.find(p => p._id === selectedProjectId)

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

                {/* Stock Table */}
                {selectedProjectId && (
                    <div className="glass-card rounded-2xl overflow-hidden">
                        {/* Card Header */}
                        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-primary/5">
                            <div className="flex items-center gap-2">
                                <Package className="w-4 h-4 text-primary" />
                                <h3 className="text-sm font-bold uppercase tracking-wider">
                                    {selectedProject?.name || ""}
                                </h3>
                            </div>
                            <span className="text-xs text-muted-foreground font-medium">
                                {materials.length} {materials.length === 1 ? "item" : "items"}
                            </span>
                        </div>

                        {/* Column Headers */}
                        <div className="grid grid-cols-12 px-4 py-2 border-b border-white/5 bg-black/10">
                            <span className="col-span-6 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                {t("stock.material") || "Material"}
                            </span>
                            <span className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                                {t("stock.unit") || "Unit"}
                            </span>
                            <span className="col-span-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right">
                                {t("stock.quantity") || "Stock Qty"}
                            </span>
                        </div>

                        {/* Rows */}
                        {loading ? (
                            <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground text-sm">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>{t("stock.loading") || "Loading stock..."}</span>
                            </div>
                        ) : materials.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground text-sm">
                                {t("stock.no_materials") || "No materials found for this project."}
                            </div>
                        ) : (
                            <div className="divide-y divide-white/5">
                                {materials.map((mat: any, i: number) => {
                                    const isLow = mat.stockQuantity <= 5
                                    const isOut = mat.stockQuantity === 0
                                    return (
                                        <div
                                            key={mat._id}
                                            className={`grid grid-cols-12 items-center px-4 py-3 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-black/10'}`}
                                        >
                                            {/* Name */}
                                            <div className="col-span-6 flex items-center gap-2">
                                                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${isOut ? 'bg-red-500' : isLow ? 'bg-amber-500' : 'bg-green-500'}`} />
                                                <span className="font-medium text-sm truncate">{mat.name}</span>
                                            </div>
                                            {/* Unit */}
                                            <div className="col-span-3 text-center">
                                                <span className="text-xs text-muted-foreground font-medium uppercase">{mat.unit}</span>
                                            </div>
                                            {/* Quantity */}
                                            <div className="col-span-3 text-right">
                                                <span className={`text-sm font-bold tabular-nums ${isOut ? 'text-red-500' : isLow ? 'text-amber-500' : 'text-foreground'}`}>
                                                    {mat.stockQuantity}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )}

                        {/* Legend */}
                        {materials.length > 0 && (
                            <div className="px-4 py-3 border-t border-white/5 bg-black/10 flex items-center gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-green-500" />
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">In Stock</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                                    <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Low (&le;5)</span>
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
