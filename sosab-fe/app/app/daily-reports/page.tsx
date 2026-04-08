"use client"

import { useState, useEffect, useCallback } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import {
    ClipboardList,
    Download,
    Calendar,
    ArrowLeft,
    Trash2,
    Pencil,
    FileText,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronUp,
    LayoutList,
    Search
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
import { Textarea } from "@/components/ui/textarea"
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
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface DailyLog {
    _id: string
    date: string
    workCompleted?: string
    issues?: string
    notes?: string
    workersPresent: number
    progress: number
    projectId?: { _id: string; name: string }
    loggedBy?: { name: string }
}

export default function DailyReportsPage() {
    const { t } = useLanguage()
    const [activityReports, setActivityReports] = useState<any[]>([]) // Generated PDFs
    const [logs, setLogs] = useState<DailyLog[]>([]) // Raw logs
    const [projects, setProjects] = useState<any[]>([])
    const [loadingReports, setLoadingReports] = useState(false)
    const [loadingLogs, setLoadingLogs] = useState(false)
    const [generating, setGenerating] = useState(false)
    const router = useRouter()

    const [filters, setFilters] = useState({
        projectId: "all",
        startDate: format(new Date(new Date().setDate(new Date().getDate() - 7)), 'yyyy-MM-dd'),
        endDate: format(new Date(), 'yyyy-MM-dd')
    })

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null)
    const [deleting, setDeleting] = useState(false)

    // Edit state
    const [editLog, setEditLog] = useState<DailyLog | null>(null)
    const [editForm, setEditForm] = useState({ workCompleted: "", date: "" })
    const [saving, setSaving] = useState(false)

    // Expanded rows for long text
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const projectsRes = await api.get('/projects')
                if (projectsRes.data.success) {
                    setProjects(projectsRes.data.data)
                }
            } catch (error) {
                console.error("Failed to load projects", error)
            }
        }
        fetchBaseData()
    }, [])

    const fetchLogs = useCallback(async () => {
        if (filters.projectId === 'all') {
            setLogs([])
            return
        }
        try {
            setLoadingLogs(true)
            const params = {
                startDate: filters.startDate,
                endDate: filters.endDate,
            }
            const res = await api.get(`/daily-reports/${filters.projectId}`, { params })
            if (res.data.success) setLogs(res.data.data)
        } catch (error) {
            console.error("Failed to fetch daily logs", error)
        } finally {
            setLoadingLogs(false)
        }
    }, [filters.projectId, filters.startDate, filters.endDate])

    const fetchGeneratedPDFs = useCallback(async () => {
        try {
            setLoadingReports(true)
            const res = await api.get('/reports?type=activity')
            if (res.data.success) {
                let data = res.data.data;
                if (filters.projectId !== 'all') {
                    data = data.filter((r: any) => r.projectId?._id === filters.projectId)
                }
                setActivityReports(data)
            }
        } catch (error) {
            console.error("Failed to fetch generated reports", error)
        } finally {
            setLoadingReports(false)
        }
    }, [filters.projectId])

    useEffect(() => {
        fetchLogs()
        fetchGeneratedPDFs()
    }, [fetchLogs, fetchGeneratedPDFs])

    const handleGenerateActivityReport = async () => {
        if (filters.projectId === 'all') {
            toast.error("Veuillez sélectionner un chantier spécifique")
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
                toast.success("Rapport généré avec succès")
                const apiUrl = require('@/lib/api').BACKEND_URL
                window.open(`${apiUrl}${res.data.data.pdfUrl}`, '_blank')
                fetchGeneratedPDFs()
            }
        } catch (error: any) {
            console.error("Failed to generate report", error)
            toast.error(error.response?.data?.message || "Échec de la génération")
        } finally {
            setGenerating(false)
        }
    }

    const handleDeleteLog = async () => {
        if (!deleteId) return
        try {
            setDeleting(true)
            await api.delete(`/daily-reports/report/${deleteId}`)
            setLogs(prev => prev.filter(l => l._id !== deleteId))
            toast.success("Entrée supprimée")
        } catch (error) {
            console.error(error)
            toast.error("Suppression échouée")
        } finally {
            setDeleting(false)
            setDeleteId(null)
        }
    }

    const handleUpdateLog = async () => {
        if (!editLog) return
        try {
            setSaving(true)
            const res = await api.patch(`/daily-reports/report/${editLog._id}`, editForm)
            if (res.data.success) {
                setLogs(prev => prev.map(l => l._id === editLog._id ? { ...l, ...editForm, date: new Date(editForm.date).toISOString() } : l))
                toast.success("Rapport mis à jour")
                setEditLog(null)
            }
        } catch (error) {
            console.error(error)
            toast.error("Mise à jour échouée")
        } finally {
            setSaving(false)
        }
    }

    const toggleRow = (id: string) => {
        setExpandedRows(prev => {
            const next = new Set(prev)
            if (next.has(id)) next.delete(id)
            else next.add(id)
            return next
        })
    }

    const groupedLogs = logs.reduce<Record<string, DailyLog[]>>((acc, log) => {
        const d = format(new Date(log.date), 'yyyy-MM-dd')
        if (!acc[d]) acc[d] = []
        acc[d].push(log)
        return acc
    }, {})

    return (
        <div className="p-4 space-y-8 pb-24 max-w-7xl mx-auto transition-colors duration-300">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button 
                        variant="secondary" 
                        size="icon" 
                        onClick={() => router.back()} 
                        className="rounded-full h-10 w-10 shadow-sm border border-border"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-black tracking-tight flex items-center gap-2 text-foreground">
                            <ClipboardList className="w-7 h-7 text-yellow-500" />
                            Rapports Journaliers
                        </h1>
                        <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-[0.2em] ml-1">
                            Suivi des activités et exportations PDF
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Navigation Bar */}
            <Card className="border-border bg-card/60 backdrop-blur-md shadow-lg rounded-3xl overflow-visible">
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-4 items-end gap-6">
                        {/* Site Selection */}
                        <div className="lg:col-span-1 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                                <Search className="w-3 h-3" /> Chantier
                            </label>
                            <Select
                                value={filters.projectId}
                                onValueChange={v => setFilters(f => ({ ...f, projectId: v }))}
                            >
                                <SelectTrigger className="h-14 bg-secondary/50 border-transparent rounded-2xl focus:ring-2 focus:ring-yellow-500/20 transition-all">
                                    <SelectValue placeholder="Sélectionner un chantier" />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-border shadow-2xl">
                                    <SelectItem value="all">Tous les chantiers</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p._id} value={p._id} className="rounded-xl">{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* From Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Date Debut
                            </label>
                            <div className="relative group">
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                    className="h-14 pl-12 bg-secondary/50 border-transparent rounded-2xl focus:ring-2 focus:ring-yellow-500/20 transition-all"
                                />
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
                            </div>
                        </div>

                        {/* To Date */}
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 flex items-center gap-1.5">
                                <Calendar className="w-3 h-3" /> Date Fin
                            </label>
                            <div className="relative group">
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                    className="h-14 pl-12 bg-secondary/50 border-transparent rounded-2xl focus:ring-2 focus:ring-yellow-500/20 transition-all"
                                />
                                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-hover:text-yellow-500 transition-colors" />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            className="h-14 bg-yellow-500 hover:bg-yellow-600 text-black font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-yellow-500/20 transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-30"
                            onClick={handleGenerateActivityReport}
                            disabled={generating || filters.projectId === 'all'}
                        >
                            {generating ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                <>
                                    <Download className="w-5 h-5 mr-3" />
                                    Générer Rapport
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* RAW LOGS TABLE SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2.5">
                        <LayoutList className="w-4 h-4 text-yellow-500" />
                        Saisies Brutes du Chantier
                    </h2>
                    {logs.length > 0 && (
                        <Badge variant="secondary" className="text-[10px] font-black px-3 py-1 bg-yellow-500/10 text-yellow-500 border-none rounded-full">
                            {logs.length} ENTRÉES
                        </Badge>
                    )}
                </div>

                {loadingLogs ? (
                    <div className="h-80 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center bg-card/10">
                        <Loader2 className="h-10 w-10 text-yellow-500 animate-spin mb-4" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Synchronisation en cours...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="h-40 rounded-[2.5rem] border-2 border-dashed border-border flex flex-col items-center justify-center bg-card/5 text-muted-foreground/40">
                        <ClipboardList className="w-10 h-10 mb-2 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Aucune activité enregistrée sur cette période</p>
                    </div>
                ) : (
                    <div className="border border-border rounded-[2rem] overflow-hidden bg-card/60 backdrop-blur-xl shadow-2xl transition-all duration-300">
                        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-20">
                                    <tr className="bg-muted border-b border-border shadow-sm">
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-40">Calendrier</th>
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description du Travail</th>
                                        <th className="p-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right w-24">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const dateStr = format(new Date(log.date), 'yyyy-MM-dd')
                                        const isDuplicate = groupedLogs[dateStr].length > 1
                                        
                                        return (
                                            <tr key={log._id} className={cn(
                                                "border-b border-border/50 last:border-0 hover:bg-secondary/30 transition-all group",
                                                isDuplicate && "bg-amber-500/[0.04]"
                                            )}>
                                                <td className="p-5 align-top">
                                                    <div className="flex flex-col gap-1.5">
                                                        <span className="text-sm font-black text-foreground antialiased tracking-tight">
                                                            {format(new Date(log.date), 'dd/MM/yyyy')}
                                                        </span>
                                                        {isDuplicate && (
                                                            <div className="flex items-center gap-1.5 py-0.5 px-2 bg-amber-500/10 rounded-md w-fit border border-amber-500/20">
                                                                <AlertTriangle className="w-2.5 h-2.5 text-amber-500" />
                                                                <span className="text-[8px] text-amber-600 dark:text-amber-500 font-black uppercase tracking-tighter">Doublon</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-5 align-top">
                                                    <div className="space-y-2">
                                                        <p className={cn(
                                                            "text-sm leading-relaxed text-foreground font-medium",
                                                            !expandedRows.has(log._id) && "line-clamp-2"
                                                        )}>
                                                            {log.workCompleted || "Aucune description fournie."}
                                                        </p>
                                                        {log.workCompleted && log.workCompleted.length > 140 && (
                                                            <button 
                                                                onClick={() => toggleRow(log._id)}
                                                                className="text-[10px] font-black text-yellow-600 dark:text-yellow-500 uppercase tracking-tight hover:opacity-70 flex items-center gap-1 transition-opacity"
                                                            >
                                                                {expandedRows.has(log._id) ? <><ChevronUp className="w-3.5 h-3.5"/> Réduire</> : <><ChevronDown className="w-3.5 h-3.5"/> Lire la suite</>}
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-5 align-top text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <Button 
                                                            variant="secondary" 
                                                            size="icon" 
                                                            className="h-9 w-9 rounded-xl hover:bg-yellow-500 hover:text-black transition-all hover:scale-110"
                                                            onClick={() => {
                                                                setEditLog(log)
                                                                setEditForm({
                                                                    workCompleted: log.workCompleted || "",
                                                                    date: format(new Date(log.date), 'yyyy-MM-dd')
                                                                })
                                                            }}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="secondary" 
                                                            size="icon" 
                                                            className="h-9 w-9 rounded-xl hover:bg-red-500 hover:text-white transition-all hover:scale-110"
                                                            onClick={() => setDeleteId(log._id)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* GENERATED REPORTS SECTION */}
            <div className="space-y-6 pt-6">
                <div className="px-2">
                    <h2 className="text-[11px] font-black uppercase tracking-[0.25em] text-muted-foreground flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-green-500" />
                        PDF Générés pour ce chantier
                    </h2>
                </div>

                {loadingReports ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-28 rounded-[2rem] bg-card/40 animate-pulse border border-border" />
                        ))}
                    </div>
                ) : activityReports.length === 0 ? (
                    <div className="p-16 text-center bg-card/5 rounded-[2.5rem] border border-dashed border-border transition-all">
                        <p className="text-xs font-bold text-muted-foreground/30 uppercase tracking-[0.3em] italic">Archive vide</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {activityReports.map((report) => (
                            <Card
                                key={report._id}
                                className="group bg-card hover:bg-secondary/40 border-border active:scale-[0.98] transition-all cursor-pointer shadow-sm hover:shadow-2xl rounded-[2rem] relative overflow-hidden"
                                onClick={() => {
                                    const apiUrl = require('@/lib/api').BACKEND_URL
                                    window.open(`${apiUrl}${report.pdfUrl}`, '_blank')
                                }}
                            >
                                <div className="p-6 flex items-center gap-5">
                                    <div className="p-4 bg-red-500/10 text-red-500 rounded-2xl group-hover:bg-red-500 group-hover:text-white transition-all duration-300 shadow-sm">
                                        <FileText className="w-7 h-7" />
                                    </div>
                                    <div className="flex-1 space-y-1 pr-6">
                                        <h3 className="font-black text-sm text-foreground line-clamp-1 antialiased uppercase tracking-tighter">{report.projectId?.name || "Sans Nom"}</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold tracking-tight">
                                            {format(new Date(report.createdAt), 'dd MMM yyyy • HH:mm')}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-4 right-4 h-9 w-9 text-muted-foreground hover:bg-black hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        api.delete(`/reports/${report._id}`).then(() => fetchGeneratedPDFs())
                                    }}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* EDIT MODAL - Theme Aware */}
            <Dialog open={!!editLog} onOpenChange={(open) => !open && setEditLog(null)}>
                <DialogContent className="max-w-xl bg-background border-border rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.1)] overflow-hidden">
                    <DialogHeader className="p-2">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                            <div className="p-2 bg-yellow-500/10 rounded-xl">
                                <Pencil className="w-5 h-5 text-yellow-500" />
                            </div>
                            Correction du Rapport
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-6 px-2">
                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date d'activité</Label>
                            <Input 
                                type="date"
                                value={editForm.date}
                                onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                                className="h-14 bg-secondary/80 border-transparent rounded-2xl focus:ring-2 focus:ring-yellow-500/20 px-5 font-black text-foreground antialiased"
                            />
                        </div>

                        <div className="space-y-3">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Définition des Travaux réalisés</Label>
                            <Textarea 
                                value={editForm.workCompleted}
                                onChange={e => setEditForm(f => ({ ...f, workCompleted: e.target.value }))}
                                className="min-h-[250px] bg-secondary/80 border-transparent rounded-2xl focus:ring-2 focus:ring-yellow-500/20 text-sm leading-relaxed p-5 font-medium resize-none shadow-inner"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-4 p-2">
                        <Button 
                            variant="secondary" 
                            onClick={() => setEditLog(null)} 
                            className="flex-1 rounded-2xl h-14 uppercase font-black text-[10px] tracking-widest transition-all"
                        >
                            Annuler
                        </Button>
                        <Button 
                            className="flex-[2] bg-yellow-500 hover:bg-yellow-600 text-black font-black text-[10px] tracking-widest h-14 rounded-2xl shadow-lg shadow-yellow-500/20 transition-all hover:-translate-y-0.5"
                            onClick={handleUpdateLog}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : "APPLIQUER LES MODIFICATIONS"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE ALERT - Theme Aware */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-background border-border rounded-[2.5rem] shadow-2xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-black antialiased tracking-tight">Supprimer cette activité ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm font-medium text-muted-foreground/80 leading-relaxed">
                            Cette action est irréversible. Les données brutes et les doublons seront définitivement supprimés de la base de données.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-3 mt-4">
                        <AlertDialogCancel className="rounded-2xl border-border h-14 font-black uppercase text-[10px] tracking-widest hover:bg-secondary transition-all">
                            Annuler
                        </AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteLog} 
                            disabled={deleting}
                            className="rounded-2xl bg-red-600 hover:bg-red-700 h-14 font-black text-[10px] tracking-widest flex-1 shadow-lg shadow-red-600/20 transition-all hover:-translate-y-0.5"
                        >
                            {deleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "CONFIRMER LA SUPPRESSION"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
