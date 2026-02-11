"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Calendar, ArrowLeft, Trash2, Search, Filter, Package, AlertCircle, HardHat, Image as ImageIcon } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDeleteReport = async () => {
        if (!deleteId) return
        try {
            await api.delete(`/reports/${deleteId}`)
            setReports(prev => prev.filter(r => r._id !== deleteId))
            toast.success("Report deleted")
        } catch (error) {
            console.error("Failed to delete report", error)
            toast.error("Failed to delete report")
        } finally {
            setDeleteId(null)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const reportsRes = await api.get('/reports')
                if (reportsRes.data.success) {
                    // Filter out activity reports as they are now in their own page
                    setReports(reportsRes.data.data.filter((r: any) => r.type !== 'activity'))
                }
            } catch (error) {
                console.error("Failed to load reports", error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const openReport = (pdfUrl: string) => {
        const apiUrl = require('@/lib/api').BACKEND_URL;
        window.open(`${apiUrl}${pdfUrl}`, '_blank')
    }

    return (
        <div className="p-4 space-y-4 pb-24">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        Technical Reports
                    </h1>
                    <p className="text-muted-foreground text-xs">Manage and generate technical & financial reports.</p>
                </div>
                <div className="ml-auto">
                    <Button size="sm" onClick={() => router.push('/app/reports/generate')}>
                        + New
                    </Button>
                </div>
            </div>

            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground animate-pulse font-medium">Loading reports...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/30">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-lg">No reports found.</p>
                        <p className="text-xs opacity-60">Generate a new technical report to see it here.</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reports.map((report) => (
                            <Card key={report._id} className="group overflow-hidden border-border/40 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => openReport(report.pdfUrl)}>
                                <CardContent className="p-0">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500/20 transition-colors">
                                                <FileText className="w-6 h-6" />
                                            </div>
                                            <div className="space-y-1">
                                                <h3 className="font-bold text-sm tracking-tight text-foreground/90">
                                                    {report.projectId?.name || 'Unknown Project'}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[10px] uppercase font-bold px-1.5 py-0 rounded-md bg-muted/30">
                                                        {report.type}
                                                    </Badge>
                                                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest opacity-60">
                                                        {report.week && report.week !== 'CUSTOM' ? `Week ${report.week}` : 'Custom Range'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-primary/5 hover:text-primary" onClick={(e) => {
                                                e.stopPropagation()
                                                openReport(report.pdfUrl)
                                            }}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={(e) => {
                                                e.stopPropagation()
                                                setDeleteId(report._id)
                                            }}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="px-4 py-2 bg-muted/20 border-t border-border/20 flex justify-between items-center text-[10px]">
                                        <span className="text-muted-foreground font-medium flex items-center gap-1">
                                            <Calendar className="w-3 h-3" />
                                            {format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm')}
                                        </span>
                                        {!report.week || report.week === 'CUSTOM' ? (
                                            <span className="font-black opacity-40">
                                                {format(new Date(report.startDate), 'dd MMM')} - {format(new Date(report.endDate), 'dd MMM')}
                                            </span>
                                        ) : null}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-white/5 bg-background/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-xl">Delete Report?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the selected report file.
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
