"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { FileText, Download, Calendar, ArrowLeft, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
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

export default function OwnerReportsHistoryPage() {
    const [reports, setReports] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const router = useRouter()

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDeleteReport = async () => {
        if (!deleteId) return
        try {
            await api.delete(`/reports/${deleteId}`)
            setReports(prev => prev.filter(r => r._id !== deleteId))
            toast.success("Rapport supprimé avec succès")
        } catch (error) {
            console.error("Failed to delete report", error)
            toast.error("Échec de la suppression")
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
        <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-300">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.push('/owner/reports')} className="rounded-xl">
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        Historique des Rapports
                    </h1>
                    <p className="text-muted-foreground text-xs">Consulter, télécharger ou supprimer tous les rapports générés</p>
                </div>
                <div className="ml-auto">
                    <Button size="sm" onClick={() => router.push('/owner/reports')} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold">
                        + Nouveau
                    </Button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-muted-foreground animate-pulse font-medium">Chargement des rapports...</div>
                ) : reports.length === 0 ? (
                    <div className="text-center py-20 text-muted-foreground bg-muted/20 rounded-2xl border border-dashed border-border/30">
                        <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p className="font-medium text-sm">Aucun rapport généré</p>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                        {reports.map((report) => (
                            <Card key={report._id} className="group overflow-hidden border-border/40 hover:border-primary/20 transition-all cursor-pointer shadow-sm hover:shadow-md" onClick={() => openReport(report.pdfUrl)}>
                                <CardContent className="p-0">
                                    <div className="p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2.5 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500/20 transition-colors">
                                                <FileText className="w-5 h-5" />
                                            </div>
                                            <div className="space-y-1 min-w-0">
                                                <h3 className="font-bold text-sm tracking-tight text-foreground/90 truncate max-w-[200px]">
                                                    {report.projectId?.name || "Chantier"}
                                                </h3>
                                                <div className="flex items-center gap-2">
                                                    <Badge variant="outline" className="text-[8px] uppercase font-bold px-1.5 py-0 rounded-md bg-muted/30">
                                                        {report.type}
                                                    </Badge>
                                                    <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                                                        {report.week && report.week !== 'CUSTOM' ? `Semaine ${report.week}` : "Période Personnalisée"}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-primary/5 hover:text-primary rounded-xl" onClick={(e) => {
                                                e.stopPropagation()
                                                openReport(report.pdfUrl)
                                            }}>
                                                <Download className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive rounded-xl" onClick={(e) => {
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
                                            <span className="font-bold opacity-55 text-[9px]">
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
                <AlertDialogContent className="rounded-2xl border border-border bg-card/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-lg">Supprimer le rapport</AlertDialogTitle>
                        <AlertDialogDescription className="text-xs text-muted-foreground">
                            Êtes-vous sûr de vouloir supprimer ce rapport ? Cette action est irréversible.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl h-11 text-xs">Annuler</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteReport} className="rounded-xl h-11 text-xs bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Supprimer
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
