"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import {
    ClipboardList,
    Download,
    Calendar,
    ArrowLeft,
    Trash2,
    Search,
    Filter,
    Package,
    AlertCircle,
    HardHat,
    Image as ImageIcon,
    FileText
} from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function DailyReportsPage() {
    const [activityReports, setActivityReports] = useState<any[]>([])
    const [projects, setProjects] = useState<any[]>([])
    const [loadingReports, setLoadingReports] = useState(false)
    const [generating, setGenerating] = useState(false)
    const router = useRouter()

    const [filters, setFilters] = useState({
        projectId: "all",
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    })

    const [deleteId, setDeleteId] = useState<string | null>(null)

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const projectsRes = await api.get('/projects')
                if (projectsRes.data.success) setProjects(projectsRes.data.data)
            } catch (error) {
                console.error("Failed to load projects", error)
            }
        }
        fetchBaseData()
    }, [])

    const fetchReports = async () => {
        try {
            setLoadingReports(true)
            const res = await api.get('/reports?type=activity')
            if (res.data.success) setActivityReports(res.data.data)
        } catch (error) {
            console.error("Failed to fetch reports", error)
        } finally {
            setLoadingReports(false)
        }
    }

    useEffect(() => {
        fetchReports()
    }, [filters.projectId, filters.startDate, filters.endDate])

    const handleGenerateActivityReport = async () => {
        if (filters.projectId === 'all') {
            toast.error("Please select a specific project to generate a report")
            return
        }

        try {
            setGenerating(true)
            const res = await api.post('/reports/generate', {
                projectId: filters.projectId,
                type: 'activity',
                startDate: filters.startDate,
                endDate: filters.endDate,
                format: 'pdf'
            })

            if (res.data.success) {
                toast.success("Activity report generated successfully!")
                const apiUrl = require('@/lib/api').BACKEND_URL
                window.open(`${apiUrl}${res.data.data.pdfUrl}`, '_blank')
                fetchReports()
            }
        } catch (error: any) {
            console.error("Failed to generate report", error)
            toast.error(error.response?.data?.message || "Failed to generate activity report")
        } finally {
            setGenerating(false)
        }
    }

    const handleDeleteReport = async () => {
        if (!deleteId) return
        try {
            await api.delete(`/reports/${deleteId}`)
            setActivityReports(prev => prev.filter(r => r._id !== deleteId))
            toast.success("Report deleted")
        } catch (error) {
            console.error("Failed to delete report", error)
            toast.error("Failed to delete report")
        } finally {
            setDeleteId(null)
        }
    }

    const openReport = (pdfUrl: string) => {
        const apiUrl = require('@/lib/api').BACKEND_URL
        window.open(`${apiUrl}${pdfUrl}`, '_blank')
    }

    return (
        <div className="p-4 space-y-6 pb-24">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <ClipboardList className="w-6 h-6 text-primary" />
                        Daily Reports
                    </h1>
                    <p className="text-muted-foreground text-xs">Track and export daily project activities.</p>
                </div>
            </div>

            {/* Filters Card */}
            <Card className="border-border/40 shadow-sm bg-muted/10">
                <CardContent className="p-4 space-y-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1 space-y-1.5">
                            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">Project</label>
                            <Select
                                value={filters.projectId}
                                onValueChange={v => setFilters(f => ({ ...f, projectId: v }))}
                            >
                                <SelectTrigger className="bg-background rounded-xl border-border/50">
                                    <SelectValue placeholder="Select Project" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Projects</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-[2] grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">From</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="date"
                                        value={filters.startDate}
                                        onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                        className="pl-10 bg-background rounded-xl border-border/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black uppercase tracking-widest text-muted-foreground ml-1">To</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                    <Input
                                        type="date"
                                        value={filters.endDate}
                                        onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                        className="pl-10 bg-background rounded-xl border-border/50"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="md:w-32">
                            <Button
                                className="w-full h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                                onClick={handleGenerateActivityReport}
                                disabled={generating || filters.projectId === 'all'}
                            >
                                {generating ? (
                                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <Download className="w-4 h-4 mr-2" />
                                        Generate
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Generated Reports Section */}
            <div className="space-y-4 max-w-2xl">
                <h2 className="text-sm font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-1">
                    <FileText className="w-4 h-4" />
                    Activity PDFs
                </h2>

                {loadingReports ? (
                    <div className="text-center py-12 animate-pulse text-muted-foreground bg-muted/10 rounded-2xl border border-border/30">
                        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
                        <p className="font-medium text-sm">Loading reports...</p>
                    </div>
                ) : activityReports.length === 0 ? (
                    <div className="p-12 text-center bg-muted/20 rounded-2xl border border-dashed text-muted-foreground border-border/30">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-10" />
                        <p className="font-medium">No PDFs generated yet.</p>
                        <p className="text-xs opacity-60 mt-1">Select a project and click Generate to create a report.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {activityReports.map((report) => (
                            <Card
                                key={report._id}
                                className="group overflow-hidden border-border/40 hover:border-primary/30 hover:bg-primary/5 transition-all cursor-pointer shadow-sm"
                                onClick={() => openReport(report.pdfUrl)}
                            >
                                <div className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500/20 transition-colors">
                                            <FileText className="w-6 h-6" />
                                        </div>
                                        <div className="space-y-0.5">
                                            <h3 className="font-bold text-sm tracking-tight">{report.projectId?.name || 'Project'}</h3>
                                            <p className="text-xs text-muted-foreground font-medium">
                                                {format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm')}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-lg"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            setDeleteId(report._id)
                                        }}
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-white/5 bg-background/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Report?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the selected activity report.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteReport} className="rounded-xl h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
