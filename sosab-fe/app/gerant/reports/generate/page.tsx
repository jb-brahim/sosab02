"use client"

import { useState, useEffect } from "react"
import api, { BACKEND_URL } from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    FileText,
    Download,
    ArrowLeft,
    FileSpreadsheet,
    Calendar,
    Users,
    CreditCard,
    CheckCircle2,
    ChevronRight,
    Loader2
} from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"
import { startOfWeek, endOfWeek, subWeeks, startOfMonth, endOfMonth, format } from "date-fns"

export default function GerantGenerateReportPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    const [formData, setFormData] = useState({
        projectId: "",
        type: "attendance",
        startDate: "",
        endDate: "",
        format: "pdf"
    })

    const [dateRangeType, setDateRangeType] = useState<"this_week" | "last_week" | "this_month" | "custom">("this_week")

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true)
                const res = await api.get('/projects')
                if (res.data.success) {
                    setProjects(res.data.data)
                    if (res.data.data.length > 0) {
                        setFormData(prev => ({ ...prev, projectId: res.data.data[0]._id }))
                    }
                }
            } catch (error) {
                console.error("Failed to load projects", error)
                toast.error(t("reports.failed_to_load_projects") || "Failed to load projects")
            } finally {
                setLoading(false)
            }
        }
        fetchProjects()
    }, [t])

    // Update dates based on type
    useEffect(() => {
        const now = new Date()
        let start: Date, end: Date

        switch (dateRangeType) {
            case "this_week":
                start = startOfWeek(now, { weekStartsOn: 0 })
                end = endOfWeek(now, { weekStartsOn: 0 })
                break
            case "last_week":
                const lastWeek = subWeeks(now, 1)
                start = startOfWeek(lastWeek, { weekStartsOn: 0 })
                end = endOfWeek(lastWeek, { weekStartsOn: 0 })
                break
            case "this_month":
                start = startOfMonth(now)
                end = endOfMonth(now)
                break
            case "custom":
                return // Don't auto-update if custom
            default:
                return
        }

        setFormData(prev => ({
            ...prev,
            startDate: format(start, "yyyy-MM-dd"),
            endDate: format(end, "yyyy-MM-dd")
        }))
    }, [dateRangeType])

    const handleGenerate = async () => {
        if (!formData.projectId) {
            toast.error(t("reports.select_project") || "Please select a project")
            return
        }
        if (!formData.startDate || !formData.endDate) {
            toast.error(t("reports.select_dates") || "Please select start and end dates")
            return
        }

        try {
            setGenerating(true)
            const res = await api.post('/reports/generate', formData)

            if (res.data.success) {
                toast.success(t("materials.arrival_success") || "Generated successfully")
                window.open(`${BACKEND_URL}${res.data.data.pdfUrl}`, '_blank')

                setTimeout(() => {
                    router.push('/gerant/reports')
                }, 1000)
            }
        } catch (error: any) {
            console.error("Failed to generate report", error)
            toast.error(error.response?.data?.message || t("reports.failed_to_generate_report") || "Failed to generate report")
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="min-h-screen bg-background pb-32">
            {/* Simple Header */}
            <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-white/5 p-4 flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-xl font-display font-bold">{t("reports.new_report") || "Nouveau Rapport"}</h1>
                    <p className="text-[10px] text-muted-foreground uppercase font-semibold tracking-tighter">Étape par étape</p>
                </div>
            </div>

            <div className="p-4 space-y-8 max-w-2xl mx-auto mt-4">

                {/* PART 1: CHANTIER */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">1</div>
                        <h2 className="text-sm font-bold uppercase tracking-wider">{t("materials.site_label") || "Quel Chantier ?"}</h2>
                    </div>
                    <Card className="border-white/5 bg-muted/20">
                        <CardContent className="p-4">
                            <Select
                                value={formData.projectId}
                                onValueChange={(val) => setFormData({ ...formData, projectId: val })}
                            >
                                <SelectTrigger className="h-14 text-base bg-background border-white/10 rounded-xl">
                                    <SelectValue placeholder={t("reports.select_project")} />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </CardContent>
                    </Card>
                </section>

                {/* PART 2: TYPE */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">2</div>
                        <h2 className="text-sm font-bold uppercase tracking-wider">{t("reports.status_label") || "Quel type de rapport ?"}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setFormData({ ...formData, type: "attendance" })}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200",
                                formData.type === "attendance"
                                    ? "bg-primary/10 border-primary shadow-lg shadow-primary/5 scale-[1.02]"
                                    : "bg-muted/30 border-white/5 hover:border-white/10"
                            )}
                        >
                            {formData.type === "attendance" && <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />}
                            <div className={cn("p-3 rounded-xl", formData.type === "attendance" ? "bg-primary/20" : "bg-background/50")}>
                                <Users className={cn("h-6 w-6", formData.type === "attendance" ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-tight text-center">
                                {t("reports.attendance_grid") || "Présence (Grille)"}
                            </span>
                        </button>

                        <button
                            onClick={() => setFormData({ ...formData, type: "payment" })}
                            className={cn(
                                "relative flex flex-col items-center justify-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200",
                                formData.type === "payment"
                                    ? "bg-primary/10 border-primary shadow-lg shadow-primary/5 scale-[1.02]"
                                    : "bg-muted/30 border-white/5 hover:border-white/10"
                            )}
                        >
                            {formData.type === "payment" && <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-primary" />}
                            <div className={cn("p-3 rounded-xl", formData.type === "payment" ? "bg-primary/20" : "bg-background/50")}>
                                <CreditCard className={cn("h-6 w-6", formData.type === "payment" ? "text-primary" : "text-muted-foreground")} />
                            </div>
                            <span className="text-xs font-bold uppercase tracking-tight text-center">
                                {t("reports.payment_summary") || "Paiements (Sommaire)"}
                            </span>
                        </button>
                    </div>
                </section>

                {/* PART 3: PERIODE */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">3</div>
                        <h2 className="text-sm font-bold uppercase tracking-wider">{t("reports.custom_range") || "Pour quelle période ?"}</h2>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {[
                            { id: "this_week", label: t("reports.this_week") || "Cette Semaine" },
                            { id: "last_week", label: t("reports.last_week") || "Semaine Dernière" },
                            { id: "this_month", label: t("reports.this_month") || "Ce Mois" },
                            { id: "custom", label: t("reports.custom") || "Personnalisé" },
                        ].map((btn) => (
                            <Button
                                key={btn.id}
                                variant={dateRangeType === btn.id ? "default" : "outline"}
                                className={cn(
                                    "h-12 rounded-xl text-xs font-bold uppercase tracking-tight",
                                    dateRangeType === btn.id && "shadow-md"
                                )}
                                onClick={() => setDateRangeType(btn.id as any)}
                            >
                                {btn.label}
                            </Button>
                        ))}
                    </div>

                    {dateRangeType === "custom" && (
                        <Card className="border-white/5 bg-primary/5 animate-in slide-in-from-top-2">
                            <CardContent className="p-4 grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t("reports.from")}</Label>
                                    <Input
                                        type="date"
                                        className="h-10 bg-background"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] font-bold text-muted-foreground uppercase">{t("reports.to")}</Label>
                                    <Input
                                        type="date"
                                        className="h-10 bg-background"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </section>

                {/* PART 4: FORMAT */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">4</div>
                        <h2 className="text-sm font-bold uppercase tracking-wider">{t("reports.export_format") || "Format d'export ?"}</h2>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setFormData({ ...formData, format: "pdf" })}
                            className={cn(
                                "flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                formData.format === "pdf" ? "bg-primary/10 border-primary" : "bg-muted/20 border-white/5"
                            )}
                        >
                            <FileText className={cn("h-5 w-5", formData.format === "pdf" ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-xs font-bold uppercase">{t("reports.pdf_printable") || "PDF"}</span>
                        </button>
                        <button
                            onClick={() => setFormData({ ...formData, format: "excel" })}
                            className={cn(
                                "flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all",
                                formData.format === "excel" ? "bg-primary/10 border-primary" : "bg-muted/20 border-white/5"
                            )}
                        >
                            <FileSpreadsheet className={cn("h-5 w-5", formData.format === "excel" ? "text-primary" : "text-muted-foreground")} />
                            <span className="text-xs font-bold uppercase">{t("reports.excel_editable") || "Excel"}</span>
                        </button>
                    </div>
                </section>
            </div>

            {/* Sticky Bottom Actions */}
            <div className="fixed bottom-0 left-0 w-full p-4 bg-background/80 backdrop-blur-xl border-t border-white/5 flex flex-col gap-3">
                <div className="flex items-center justify-between px-2 text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    <span>{formData.startDate}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span>{formData.endDate}</span>
                </div>
                <Button
                    onClick={handleGenerate}
                    disabled={generating || !formData.projectId}
                    className="w-full h-14 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20"
                    size="lg"
                >
                    {generating ? (
                        <Loader2 className="h-6 w-6 animate-spin text-primary-foreground" />
                    ) : (
                        <>
                            <Download className="h-5 w-5 mr-3" />
                            {t("reports.generate") || "GÉNÉRER LE RAPPORT"}
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
