"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, Printer, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { useLanguage } from "@/lib/language-context"

export default function SalaryReportPage() {
    const { t } = useLanguage()
    const { user } = useAuth()
    const router = useRouter()

    const [projects, setProjects] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [mode, setMode] = useState<"week" | "custom">("custom")
    const [selectedWeek, setSelectedWeek] = useState<string>(() => {
        // Default to current week "YYYY-Www"
        const now = new Date()
        const onejan = new Date(now.getFullYear(), 0, 1)
        const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7)
        return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`
    })
    const [startDate, setStartDate] = useState(() => {
        const now = new Date()
        return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0]
    })

    const [reportData, setReportData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Fetch user's projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects')
                const list = res.data.data || []
                setProjects(list)
                if (list.length > 0) {
                    setSelectedProject(list[0]._id)
                }
            } catch (error) {
                console.error("Failed to fetch projects", error)
            }
        }
        fetchProjects()
    }, [])

    // Fetch report when project or week changes
    useEffect(() => {
        const fetchReport = async () => {
            if (!selectedProject) return
            if (mode === "week" && !selectedWeek) return
            if (mode === "custom" && (!startDate || !endDate)) return

            try {
                setLoading(true)
                const url = mode === "custom" 
                    ? `/salary/${selectedProject}/CUSTOM?startDate=${startDate}&endDate=${endDate}` 
                    : `/salary/${selectedProject}/${selectedWeek}`
                const res = await api.get(url)
                if (res.data.success) {
                    setReportData(res.data)
                }
            } catch (error) {
                console.error("Failed to fetch salary report", error)
                toast.error("Impossible de charger le rapport de salaire")
            } finally {
                setLoading(false)
            }
        }

        fetchReport()
    }, [selectedProject, selectedWeek, mode, startDate, endDate])

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-background p-4 pb-20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 print:hidden">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">{t("reports.weekly_salary_report")}</h1>
            </div>

            {/* Controls */}
            <div className="grid gap-4 mb-6 print:hidden bg-card border border-border p-4 rounded-2xl shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                    <div className="flex-1 max-w-sm">
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("materials.site_label")}</label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("materials.site_label")} />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center gap-2 bg-background p-1.5 rounded-xl border border-border">
                        <Button 
                            variant={mode === "week" ? "default" : "ghost"} 
                            size="sm" 
                            className="rounded-lg text-xs" 
                            onClick={() => setMode("week")}
                        >
                            Par Semaine
                        </Button>
                        <Button 
                            variant={mode === "custom" ? "default" : "ghost"} 
                            size="sm" 
                            className="rounded-lg text-xs" 
                            onClick={() => setMode("custom")}
                        >
                            Période Personnalisée
                        </Button>
                    </div>
                </div>

                <div className="pt-2">
                    {mode === "week" ? (
                        <div className="max-w-xs">
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">{t("reports.week")}</label>
                            <Input
                                type="week"
                                value={selectedWeek}
                                onChange={(e) => setSelectedWeek(e.target.value)}
                            />
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-4">
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date de début</label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                            <div className="flex-1 min-w-[150px]">
                                <label className="text-xs font-medium text-muted-foreground mb-1 block">Date de fin</label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : reportData ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Summary Card */}
                    <Card className="border-primary/20 bg-primary/5 print:border-none print:shadow-none">
                        <CardHeader className="text-center pb-2">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <h2 className="text-lg font-bold uppercase tracking-wider">{reportData.project.name}</h2>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {mode === "custom" ? `Du ${startDate} au ${endDate}` : `${t("reports.week")} ${reportData.week}`}
                            </p>
                        </CardHeader>
                        <CardContent className="text-center">
                            <span className="text-xs text-muted-foreground uppercase">{t("reports.total_payout")}</span>
                            <div className="text-4xl font-bold text-primary mt-1">
                                ${reportData.totalSalary.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Worker Breakdown */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider ml-1">{t("reports.breakdown")}</h3>
                        {!reportData.data?.workers?.length ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                {t("reports.no_salary_records")}
                            </div>
                        ) : (
                            reportData.data.workers.map((w: any) => (
                                <Card key={w.workerId} className="print:shadow-none print:border-b print:rounded-none">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{w.workerName}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span className="bg-secondary px-1.5 py-0.5 rounded">
                                                    {w.daysWorked} {t("reports.days_worked")}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">{w.totalSalary?.toLocaleString() || 0} Dinar</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Taux journalier: {w.dailyRate?.toLocaleString() || 0} Dinar
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Print Button */}
                    <Button className="w-full print:hidden" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        {t("reports.print_pdf")}
                    </Button>
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">{t("reports.select_project_week")}</div>
            )}

            {/* hidden print styles */}
            <style jsx global>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    )
}
