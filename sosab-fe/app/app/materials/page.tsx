"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { Package, Download, FileText, ArrowUpRight, ArrowDownLeft, Box, Search } from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export default function MaterialsPage() {
    const router = useRouter()
    const [materials, setMaterials] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [reportDates, setReportDates] = useState({ start: '', end: '' })
    const [generatingReport, setGeneratingReport] = useState(false)
    const [showReportDialog, setShowReportDialog] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Load Materials Summary across all projects
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

    const handleGenerateReport = async () => {
        toast.error("Global reports are coming soon!")
    }

    return (
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Package className="w-8 h-8 text-primary" />
                    Site Materials
                </h1>
                <p className="text-muted-foreground text-sm font-medium">Global arrival tracking across all your sites.</p>
            </div>

            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        type="text"
                        placeholder="Search by supplier name..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-12 bg-card border-border/50 focus:border-primary/50 transition-colors"
                    />
                </div>

                {/* Materials List */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Inventory & History</label>
                        <span className="text-[10px] font-bold text-primary/70">
                            {materials.filter(item =>
                                item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
                            ).length} ITEMS
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
                            <div className="h-8 w-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                            <span className="text-xs font-bold uppercase tracking-widest">Loading Sites...</span>
                        </div>
                    ) : materials.filter(item =>
                        item.supplier.toLowerCase().includes(searchQuery.toLowerCase())
                    ).length === 0 ? (
                        <Card className="border-dashed border-2 py-10">
                            <CardContent className="p-6 text-center text-muted-foreground">
                                <Package className="w-12 h-12 mx-auto mb-2 opacity-20" />
                                <p className="font-medium">
                                    {searchQuery ? `No materials found for supplier "${searchQuery}"` : "No materials recorded yet."}
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-3">
                            {materials
                                .filter(item => item.supplier.toLowerCase().includes(searchQuery.toLowerCase()))
                                .sort((a, b) => a.name.localeCompare(b.name) || a.supplier.localeCompare(b.supplier))
                                .map((item) => (
                                    <Card
                                        key={item.materialId}
                                        className="overflow-hidden border-border/50 hover:border-primary/30 transition-all active:scale-[0.98] cursor-pointer group"
                                        onClick={() => router.push(`/app/materials/${item.materialId}`)}
                                    >
                                        <div className="p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div className="space-y-1">
                                                    <div className="font-display font-bold text-lg group-hover:text-primary transition-colors">{item.name}</div>
                                                    <div className="flex flex-wrap gap-2">
                                                        <Badge variant="secondary" className="bg-muted text-[9px] uppercase font-bold text-muted-foreground border-none px-1.5 h-4">
                                                            {item.projectName}
                                                        </Badge>
                                                        <Badge variant="outline" className="text-[9px] uppercase font-bold text-muted-foreground border-border/50 px-1.5 h-4">
                                                            {item.supplier}
                                                        </Badge>
                                                    </div>
                                                </div>
                                                <ArrowUpRight className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                                            </div>

                                            <div className="bg-success/5 p-3 rounded-xl border border-success/10 flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] uppercase font-black text-success/60 tracking-tighter flex items-center gap-1">
                                                        <ArrowDownLeft className="w-3 h-3" /> Received to date
                                                    </span>
                                                    <span className="text-xl font-display font-black text-success">
                                                        {item.totalIn} <span className="text-[10px] font-bold opacity-60 ml-0.5">{item.unit}</span>
                                                    </span>
                                                </div>
                                                <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-success opacity-40 shadow-sm" />
                                                </div>
                                            </div>
                                        </div>
                                    </Card>
                                ))}
                        </div>
                    )}
                </div>
            </div>

        </div>
    )
}
