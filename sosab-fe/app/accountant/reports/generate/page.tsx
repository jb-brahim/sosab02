"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, Calendar, ArrowLeft, FileSpreadsheet, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLanguage } from "@/lib/language-context"
import { MultiSelect } from "@/components/ui/multi-select"
import { format } from "date-fns"

export default function GenerateReportPage() {
    const { t } = useLanguage()
    const router = useRouter()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)
    const [recentReports, setRecentReports] = useState<any[]>([])

    const [formData, setFormData] = useState({
        projectIds: [] as string[],
        type: "attendance",
        startDate: "",
        endDate: "",
        format: "pdf"
    })

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [projectsRes, reportsRes] = await Promise.all([
                    api.get('/projects'),
                    api.get('/reports')
                ])
                if (projectsRes.data.success) {
                    setProjects(projectsRes.data.data)
                }
                if (reportsRes.data.success) {
                    const sortedReports = reportsRes.data.data
                        .filter((r: any) => r.type !== 'activity')
                        .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .slice(0, 5)
                    setRecentReports(sortedReports)
                }
            } catch (error) {
                console.error("Failed to load page data", error)
                toast.error(t("reports.failed_to_load_projects"))
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleGenerate = async () => {
        // Validation
        if (formData.projectIds.length === 0) {
            toast.error(t("reports.select_project"))
            return
        }
        if (!formData.startDate || !formData.endDate) {
            toast.error(t("reports.select_dates"))
            return
        }

        // Validate date range
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (start > end) {
            toast.error(t("reports.date_order_error"))
            return
        }

        try {
            setGenerating(true)
            const res = await api.post('/reports/generate', {
                ...formData,
                projectId: formData.projectIds[0], // Keep for backward compat if any logic needs it, but backend uses projectIds
            })

            if (res.data.success) {
                toast.success(`${formData.type === 'attendance' ? t("reports.attendance_grid") : t("reports.payment_summary")} ${t("materials.arrival_success")}`)

                // Download the file
                const apiUrl = require('@/lib/api').BACKEND_URL;
                const downloadUrl = `${apiUrl}${res.data.data.pdfUrl}`
                window.open(downloadUrl, '_blank')

                // Redirect to reports page after a short delay
                setTimeout(() => {
                    router.push('/accountant/reports')
                }, 1500)
            }
        } catch (error: any) {
            console.error("Failed to generate report", error)
            toast.error(error.response?.data?.message || t("reports.failed_to_generate_report"))
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="p-4 space-y-6 max-w-6xl mx-auto pb-24">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        {t("reports.generate_new") || "Générer Rapport"}
                    </h1>
                    <p className="text-muted-foreground text-xs">{t("reports.create_reports_desc") || "Créez des rapports de présence ou de paiement"}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left side: Report form (7 columns) */}
                <div className="lg:col-span-7">
                    <Card className="border-border/40 shadow-md h-full">
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* Project Selection */}
                                <div className="space-y-2">
                                    <Label htmlFor="project" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("materials.site_label")}</Label>
                                    <MultiSelect
                                        options={projects.map(p => ({ label: p.name, value: p._id }))}
                                        selected={formData.projectIds}
                                        onChange={(vals) => setFormData({ ...formData, projectIds: vals })}
                                        placeholder={t("reports.select_project")}
                                    />
                                </div>

                                {/* Date Range */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Période du Rapport</Label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="startDate" className="text-[10px] font-bold text-muted-foreground/85 uppercase">{t("reports.from")}</Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="endDate" className="text-[10px] font-bold text-muted-foreground/85 uppercase">{t("reports.to")}</Label>
                                            <Input
                                                id="endDate"
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Report Type */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("reports.status_label")}</Label>
                                    <RadioGroup
                                        value={formData.type}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                        className="grid grid-cols-1 gap-2 bg-muted/20 p-3 rounded-xl border border-border/30"
                                    >
                                        <div className="flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/40 transition-colors cursor-pointer">
                                            <RadioGroupItem value="attendance" id="attendance" />
                                            <Label htmlFor="attendance" className="font-medium cursor-pointer text-sm">
                                                {t("reports.attendance_grid") || "Présence (Grille)"}
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/40 transition-colors cursor-pointer">
                                            <RadioGroupItem value="payment" id="payment" />
                                            <Label htmlFor="payment" className="font-medium cursor-pointer text-sm">
                                                {t("reports.payment_summary") || "Paiements (Sommaire)"}
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Format Selection */}
                                <div className="space-y-2">
                                    <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{t("reports.export_format")}</Label>
                                    <RadioGroup
                                        value={formData.format}
                                        onValueChange={(value) => setFormData({ ...formData, format: value })}
                                        className="grid grid-cols-2 gap-4"
                                    >
                                        <div className="flex items-center space-x-2 rounded-xl border border-border/50 p-3 hover:bg-muted/40 transition-all cursor-pointer">
                                            <RadioGroupItem value="pdf" id="pdf" />
                                            <Label htmlFor="pdf" className="font-medium cursor-pointer text-sm flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-red-500" />
                                                {t("reports.pdf_printable") || "PDF (Imprimable)"}
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 rounded-xl border border-border/50 p-3 hover:bg-muted/40 transition-all cursor-pointer">
                                            <RadioGroupItem value="excel" id="excel" />
                                            <Label htmlFor="excel" className="font-medium cursor-pointer text-sm flex items-center gap-2">
                                                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                                                {t("reports.excel_editable") || "Excel (Modifiable)"}
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Generate Button */}
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || loading || formData.projectIds.length === 0}
                                    className="w-full h-12 text-sm font-bold uppercase"
                                    size="lg"
                                >
                                    {generating ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            {t("materials.generating") || "Génération..."}
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            {t("reports.generate") || "Générer"}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right side: Insights, Guide & Recent reports (5 columns) */}
                <div className="lg:col-span-5 space-y-6">
                    {/* Guide card */}
                    <Card className="border-border/40 bg-card/40 backdrop-blur-xl">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="font-bold text-sm uppercase tracking-wider text-amber-500 flex items-center gap-2">
                                <AlertCircle className="w-4.5 h-4.5" />
                                Guide de Génération
                            </h3>
                            <div className="space-y-3 text-xs text-muted-foreground">
                                <div className="p-3 bg-muted/20 rounded-xl space-y-1 border border-border/10">
                                    <div className="font-bold text-foreground text-sm">Présence (Grille)</div>
                                    <p className="leading-relaxed">Génère un tableau détaillé montrant la présence quotidienne (0/1) de chaque travailleur pour la période sélectionnée.</p>
                                </div>
                                <div className="p-3 bg-muted/20 rounded-xl space-y-1 border border-border/10">
                                    <div className="font-bold text-foreground text-sm">Paiements (Sommaire)</div>
                                    <p className="leading-relaxed">Génère un récapitulatif financier complet comprenant les salaires de base, heures supplémentaires, bonus, pénalités et le montant net à payer.</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Recent reports card */}
                    <Card className="border-border/40 shadow-md">
                        <CardContent className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/80">
                                    Rapports Récents
                                </h3>
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={() => router.push('/accountant/reports')} 
                                    className="h-auto p-0 text-amber-500 hover:text-amber-600 font-bold text-xs"
                                >
                                    Voir tout
                                </Button>
                            </div>
                            
                            {loading ? (
                                <div className="py-8 text-center text-muted-foreground animate-pulse text-xs font-medium">Chargement...</div>
                            ) : recentReports.length === 0 ? (
                                <div className="py-12 text-center text-muted-foreground text-xs bg-muted/5 rounded-xl border border-dashed border-border/30">
                                    <FileText className="w-8 h-8 mx-auto mb-2 opacity-25" />
                                    Aucun rapport généré récemment
                                </div>
                            ) : (
                                <div className="space-y-2.5">
                                    {recentReports.map((report) => (
                                        <div 
                                            key={report._id} 
                                            className="p-3 rounded-xl bg-muted/5 border border-border/40 hover:border-amber-500/20 hover:bg-amber-500/5 transition-all flex items-center justify-between cursor-pointer group"
                                            onClick={() => {
                                                const apiUrl = require('@/lib/api').BACKEND_URL;
                                                window.open(`${apiUrl}${report.pdfUrl}`, '_blank')
                                            }}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                                    <FileText className="w-4 h-4" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold truncate text-foreground/90 group-hover:text-amber-500 transition-colors">
                                                        {report.projectId?.name || "Projet"}
                                                    </div>
                                                    <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-0.5">
                                                        <span className="uppercase font-semibold text-[9px] bg-muted/30 px-1 rounded">{report.type}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(report.createdAt), 'dd MMM, HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-transparent">
                                                <Download className="w-3.5 h-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
