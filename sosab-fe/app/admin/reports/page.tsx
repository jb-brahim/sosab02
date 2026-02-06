"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Calendar, Trash2, Plus, Clock, MapPin, Eye, FileSpreadsheet } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"

export default function AdminReportsPage() {
    const [reports, setReports] = useState<any[]>([])
    const [dailyLogs, setDailyLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [logsLoading, setLogsLoading] = useState(true)
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState("generated")
    const router = useRouter()

    const fetchReports = async () => {
        try {
            setLoading(true)
            const res = await api.get('/reports')
            if (res.data.success) {
                setReports(res.data.data)
            }
        } catch (error) {
            console.error("Failed to load reports", error)
            toast.error("Failed to load reports")
        } finally {
            setLoading(false)
        }
    }

    const fetchDailyLogs = async () => {
        try {
            setLogsLoading(true)
            // Fetch all reports using the 'all' project ID
            const res = await api.get('/daily-reports/all?limit=50')
            if (res.data.success) {
                setDailyLogs(res.data.data)
            }
        } catch (error) {
            console.error("Failed to load daily logs", error)
            toast.error("Failed to load daily logs")
        } finally {
            setLogsLoading(false)
        }
    }

    useEffect(() => {
        fetchReports()
        fetchDailyLogs()
    }, [])

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

    const openReport = (pdfUrl: string) => {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const backendBase = apiUrl.replace(/\/api\/?$/, '')
        window.open(`${backendBase}${pdfUrl}`, '_blank')
    }

    return (
        <div className="p-4 md:p-8 space-y-8 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-4xl font-bold font-display tracking-tight text-foreground/90">Reports Center</h1>
                    <p className="text-muted-foreground mt-1">Manage generated exports and view daily manager submissions.</p>
                </div>
                <Button
                    size="lg"
                    className="h-12 px-6 gap-2 shadow-lg shadow-primary/20 rounded-xl"
                    onClick={() => router.push('/admin/reports/generate')}
                >
                    <Plus className="w-5 h-5" />
                    New Report
                </Button>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md h-12 p-1 bg-muted/50 rounded-xl mb-8">
                    <TabsTrigger value="generated" className="rounded-lg font-semibold text-sm gap-2">
                        <FileText className="w-4 h-4" />
                        Generated Files
                    </TabsTrigger>
                    <TabsTrigger value="logs" className="rounded-lg font-semibold text-sm gap-2">
                        <Clock className="w-4 h-4" />
                        Daily Submissions
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="generated" className="space-y-4 outline-none">
                    {loading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="h-20 bg-muted/50 rounded-xl animate-pulse" />
                            ))}
                        </div>
                    ) : reports.length === 0 ? (
                        <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-border/50">
                            <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                            <h2 className="text-lg font-semibold">No reports generated</h2>
                            <p className="text-muted-foreground mt-1 mb-6">Start by creating a new document.</p>
                            <Button variant="outline" onClick={() => router.push('/admin/reports/generate')} className="rounded-xl">
                                Generate your first report
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {reports.map((report) => (
                                <Card key={report._id} className="group border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300 rounded-xl overflow-hidden cursor-pointer" onClick={() => openReport(report.pdfUrl)}>
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl ${report.type === 'attendance' ? 'bg-blue-50 text-blue-600' :
                                                (report.type === 'payment' || report.type === 'salary') ? 'bg-green-50 text-green-600' :
                                                    report.type === 'material' ? 'bg-orange-50 text-orange-600' :
                                                        'bg-purple-50 text-purple-600'
                                                }`}>
                                                {report.format === 'excel' ? <FileSpreadsheet className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                                            </div>
                                            <div className="space-y-0.5">
                                                <h3 className="font-bold text-sm md:text-base group-hover:text-primary transition-colors">
                                                    {report.projectId?.name || 'Unknown Project'} - {report.type.toUpperCase()}
                                                </h3>
                                                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                    <span className="flex items-center gap-1 font-medium italic">
                                                        <Calendar className="w-3 h-3" />
                                                        {report.week && report.week !== 'CUSTOM' ? `Week ${report.week}` : `${format(new Date(report.startDate), 'dd/MM')} - ${format(new Date(report.endDate), 'dd/MM')}`}
                                                    </span>
                                                    <span className="opacity-50">|</span>
                                                    <span>Created {format(new Date(report.createdAt), 'MMM dd, HH:mm')}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-lg" onClick={() => openReport(report.pdfUrl)}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-10 w-10 text-muted-foreground hover:bg-red-50 hover:text-red-600 rounded-lg" onClick={() => setDeleteId(report._id)}>
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                <TabsContent value="logs" className="outline-none">
                    <Card className="border-border/50 rounded-2xl overflow-hidden shadow-sm">
                        <Table>
                            <TableHeader className="bg-muted/30">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableHead className="w-[120px] font-bold text-foreground">Date</TableHead>
                                    <TableHead className="font-bold text-foreground">Project</TableHead>
                                    <TableHead className="font-bold text-foreground">Progress</TableHead>
                                    <TableHead className="font-bold text-foreground">Workers</TableHead>
                                    <TableHead className="font-bold text-foreground text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logsLoading ? (
                                    [1, 2, 3, 4, 5].map(i => (
                                        <TableRow key={i}>
                                            <TableCell colSpan={5} className="h-12 animate-pulse bg-muted/5"></TableCell>
                                        </TableRow>
                                    ))
                                ) : dailyLogs.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                                            No daily logs submitted yet.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    dailyLogs.map((log) => (
                                        <TableRow key={log._id} className="group hover:bg-muted/20 border-border/50 transition-colors">
                                            <TableCell className="font-medium text-xs text-foreground/80">
                                                {format(new Date(log.date), 'MMM dd, yyyy')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-3 h-3 text-primary/60" />
                                                    <span className="font-bold text-sm tracking-tight">{log.projectId?.name || 'N/A'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                                        <div className="h-full bg-primary" style={{ width: `${log.progress}%` }} />
                                                    </div>
                                                    <span className="text-xs font-bold text-foreground/70">{log.progress}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="bg-primary/5 text-primary border-none rounded-md px-2 py-0.5 text-[10px] font-black uppercase">
                                                    {log.workersPresent} workers
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary rounded-lg" onClick={() => router.push(`/admin/projects/${log.projectId?._id}?tab=reports`)}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </Card>
                </TabsContent>
            </Tabs>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold font-display">Delete Report?</AlertDialogTitle>
                        <AlertDialogDescription className="text-base mt-2">
                            This action cannot be undone. This will permanently delete the report file.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl border-border/50 h-12 text-base">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteReport} className="rounded-xl bg-destructive text-destructive-foreground hover:bg-destructive/90 h-12 text-base">
                            Confirm Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
