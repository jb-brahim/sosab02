"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Calendar, ArrowLeft, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function ReportsPage() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const handleDeleteReport = async (reportId: string) => {
        if (!confirm("Are you sure you want to delete this report?")) return

        try {
            await api.delete(`/reports/${reportId}`)
            setReports(prev => prev.filter(r => r._id !== reportId))
            toast.success("Report deleted")
        } catch (error) {
            console.error("Failed to delete report", error)
            toast.error("Failed to delete report")
        }
    }

    useEffect(() => {
        const fetchReports = async () => {
            try {
                const res = await api.get('/reports')
                if (res.data.success) {
                    setReports(res.data.data)
                }
            } catch (error) {
                console.error("Failed to load reports", error)
            } finally {
                setLoading(false)
            }
        }
        fetchReports()
    }, [])

    const openReport = (pdfUrl: string) => {
        // Safe URL construction: Remove '/api' suffix if present in the base URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const backendBase = apiUrl.replace(/\/api\/?$/, '')
        window.open(`${backendBase}${pdfUrl}`, '_blank')
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
                        Reports
                    </h1>
                    <p className="text-muted-foreground text-xs">Manage and generate reports.</p>
                </div>
                <div className="ml-auto">
                    <Button size="sm" onClick={() => router.push('/app/reports/generate')}>
                        + New
                    </Button>
                </div>
            </div>



            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : reports.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground bg-muted/20 rounded-lg">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-20" />
                    <p>No reports found.</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {reports.map((report) => (
                        <Card key={report._id} className="active:scale-[0.99] transition-transform cursor-pointer" onClick={() => openReport(report.pdfUrl)}>
                            <CardContent className="p-4 flex items-center justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="bg-red-100 text-red-600 p-2 rounded-lg">
                                        <FileText className="w-5 h-5" />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-semibold text-sm">
                                            {report.projectId?.name || 'Unknown Project'} - {report.type.toUpperCase()}
                                        </h3>
                                        <div className="flex flex-col text-xs text-muted-foreground">
                                            {report.week && report.week !== 'CUSTOM' ? (
                                                <span className="flex items-center gap-1">
                                                    Week: {report.week}
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(report.startDate), 'dd/MM')} - {format(new Date(report.endDate), 'dd/MM/yy')}
                                                </span>
                                            )}
                                            <span className="opacity-70 mt-1">Generated: {format(new Date(report.createdAt), 'dd MMM HH:mm')}</span>
                                        </div>
                                    </div>
                                </div>
                                <Button variant="ghost" size="icon" className="text-muted-foreground mr-1" onClick={(e) => {
                                    e.stopPropagation()
                                    openReport(report.pdfUrl)
                                }}>
                                    <Download className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-red-400 hover:text-red-600 hover:bg-red-50" onClick={(e) => {
                                    e.stopPropagation()
                                    handleDeleteReport(report._id)
                                }}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
