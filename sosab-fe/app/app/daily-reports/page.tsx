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
    HardHat,
    FileText,
    AlertTriangle,
    X,
    Check,
    Loader2,
    ChevronDown,
    ChevronUp,
    LayoutList
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
    const [editForm, setEditForm] = useState({ workCompleted: "", issues: "", notes: "", workersPresent: 0 })
    const [saving, setSaving] = useState(false)

    // Expanded rows for long text
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    useEffect(() => {
        const fetchBaseData = async () => {
            try {
                const projectsRes = await api.get('/projects')
                if (projectsRes.data.success) {
                    setProjects(projectsRes.data.data)
                    // Auto-select first project if none selected and not "all"
                    if (projectsRes.data.data.length > 0 && filters.projectId === 'all') {
                        // setFilters(f => ({ ...f, projectId: projectsRes.data.data[0]._id }))
                    }
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
                // Filter PDFs by project if selected
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
                setLogs(prev => prev.map(l => l._id === editLog._id ? { ...l, ...editForm } : l))
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

    // Group logs by date to highlight duplicates
    const groupedLogs = logs.reduce<Record<string, DailyLog[]>>((acc, log) => {
        const d = format(new Date(log.date), 'yyyy-MM-dd')
        if (!acc[d]) acc[d] = []
        acc[d].push(log)
        return acc
    }, {})

    return (
        <div className="p-4 space-y-6 pb-24 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-8 w-8">
                    <ArrowLeft className="w-4 h-4" />
                </Button>
                <div>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <ClipboardList className="w-5 h-5 text-yellow-500" />
                        Rapports Journaliers
                    </h1>
                    <p className="text-muted-foreground text-[10px] uppercase font-semibold tracking-wider opacity-60">Suivez et exportez les activités quotidiennes du projet</p>
                </div>
            </div>

            {/* Filters Navigation Bar */}
            <Card className="border-white/5 bg-zinc-900/50 backdrop-blur-sm overflow-visible">
                <CardContent className="p-4">
                    <div className="flex flex-col lg:flex-row items-end gap-6">
                        {/* Site Selection */}
                        <div className="flex-1 w-full space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Site</label>
                            <Select
                                value={filters.projectId}
                                onValueChange={v => setFilters(f => ({ ...f, projectId: v }))}
                            >
                                <SelectTrigger className="h-12 bg-zinc-800/50 border-white/5 rounded-xl focus:ring-yellow-500/20">
                                    <SelectValue placeholder="Sélectionner un chantier" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10">
                                    <SelectItem value="all">Tous les chantiers</SelectItem>
                                    {projects.map(p => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* From Date */}
                        <div className="w-full lg:w-48 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">De</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="date"
                                    value={filters.startDate}
                                    onChange={e => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                    className="h-12 pl-10 bg-zinc-800/50 border-white/5 rounded-xl focus:ring-yellow-500/20"
                                />
                            </div>
                        </div>

                        {/* To Date */}
                        <div className="w-full lg:w-48 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">À</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <Input
                                    type="date"
                                    value={filters.endDate}
                                    onChange={e => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                    className="h-12 pl-10 bg-zinc-800/50 border-white/5 rounded-xl focus:ring-yellow-500/20"
                                />
                            </div>
                        </div>

                        {/* Generate Button */}
                        <Button
                            className="h-12 px-8 bg-yellow-500 hover:bg-yellow-600 text-black font-bold rounded-xl shadow-lg shadow-yellow-500/10 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                            onClick={handleGenerateActivityReport}
                            disabled={generating || filters.projectId === 'all'}
                        >
                            {generating ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    <Download className="w-4 h-4 mr-2" />
                                    Générer
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* RAW LOGS TABLE SECTION */}
            <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                        <LayoutList className="w-4 h-4 text-yellow-500/50" />
                        Activités quotidiennes (Saisie brute)
                    </h2>
                    {logs.length > 0 && (
                        <Badge variant="outline" className="text-[10px] font-bold py-0.5 px-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                            {logs.length} Entrées
                        </Badge>
                    )}
                </div>

                {loadingLogs ? (
                    <div className="h-64 rounded-2xl border border-white/5 bg-zinc-900/20 flex flex-col items-center justify-center animate-pulse">
                        <Loader2 className="h-8 w-8 text-yellow-500/20 animate-spin mb-4" />
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Chargement des données...</p>
                    </div>
                ) : logs.length === 0 ? (
                    <div className="h-32 rounded-2xl border border-dashed border-white/10 bg-zinc-900/10 flex flex-col items-center justify-center text-muted-foreground">
                        <p className="text-xs font-medium">Aucune donnée pour cette période</p>
                    </div>
                ) : (
                    <div className="border border-white/5 rounded-2xl overflow-hidden bg-zinc-900/30 backdrop-blur-sm shadow-2xl">
                        {/* Scrollable Container - Approx 8 items height */}
                        <div className="max-h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 z-10 bg-zinc-800 backdrop-blur-md shadow-sm">
                                    <tr className="border-b border-white/5">
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground w-32 bg-zinc-800">Date</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-zinc-800">Travaux réalisés</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-24 bg-zinc-800">Ouvriers</th>
                                        <th className="p-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-right w-24 bg-zinc-800">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => {
                                        const dateStr = format(new Date(log.date), 'yyyy-MM-dd')
                                        const isDuplicate = groupedLogs[dateStr].length > 1
                                        
                                        return (
                                            <tr key={log._id} className={cn(
                                                "border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group",
                                                isDuplicate && "bg-amber-500/[0.03]"
                                            )}>
                                                <td className="p-4 align-top">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-sm font-bold text-foreground/90">{format(new Date(log.date), 'dd/MM/yyyy')}</span>
                                                        {isDuplicate && (
                                                            <Badge className="text-[8px] bg-amber-500 text-black py-0 px-1 font-black w-fit">DOUBLON</Badge>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-top">
                                                    <div className="space-y-1">
                                                        <p className={cn(
                                                            "text-sm leading-relaxed text-foreground/70",
                                                            !expandedRows.has(log._id) && "line-clamp-2"
                                                        )}>
                                                            {log.workCompleted || "N/A"}
                                                        </p>
                                                        {log.workCompleted && log.workCompleted.length > 140 && (
                                                            <button 
                                                                onClick={() => toggleRow(log._id)}
                                                                className="text-[10px] font-black text-yellow-500 uppercase tracking-tighter hover:opacity-80 flex items-center gap-1"
                                                            >
                                                                {expandedRows.has(log._id) ? <><ChevronUp className="w-3 h-3"/> Voir moins</> : <><ChevronDown className="w-3 h-3"/> Voir tout</>}
                                                            </button>
                                                        )}
                                                        {log.issues && (
                                                            <div className="pt-2 flex items-start gap-2">
                                                                <AlertTriangle className="w-3.5 h-3.5 text-amber-500/80 flex-shrink-0 mt-0.5" />
                                                                <span className="text-[10px] font-medium text-amber-500/80 italic">{log.issues}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="p-4 align-top text-center text-sm font-black text-foreground/90 bg-white/[0.01]">
                                                    {log.workersPresent}
                                                </td>
                                                <td className="p-4 align-top text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-yellow-500/10 hover:text-yellow-500"
                                                            onClick={() => {
                                                                setEditLog(log)
                                                                setEditForm({
                                                                    workCompleted: log.workCompleted || "",
                                                                    issues: log.issues || "",
                                                                    notes: log.notes || "",
                                                                    workersPresent: log.workersPresent || 0
                                                                })
                                                            }}
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-8 w-8 rounded-lg text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
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
            <div className="space-y-4 pt-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
                    <FileText className="w-4 h-4 text-green-500/50" />
                    PDF D'ACTIVITÉ
                </h2>

                {loadingReports ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-24 rounded-2xl bg-zinc-900/50 animate-pulse border border-white/5" />
                        ))}
                    </div>
                ) : activityReports.length === 0 ? (
                    <div className="p-12 text-center bg-zinc-900/20 rounded-2xl border border-dashed border-white/5 text-muted-foreground">
                        <p className="text-xs font-medium opacity-40 italic">Aucun document généré pour le moment</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {activityReports.map((report) => (
                            <Card
                                key={report._id}
                                className="group bg-zinc-900/40 border-white/5 hover:border-yellow-500/30 transition-all cursor-pointer shadow-sm hover:shadow-yellow-500/5 relative overflow-hidden"
                            >
                                <div className="p-4 flex items-center gap-4" onClick={() => {
                                    const apiUrl = require('@/lib/api').BACKEND_URL
                                    window.open(`${apiUrl}${report.pdfUrl}`, '_blank')
                                }}>
                                    <div className="p-3 bg-red-500/10 text-red-500 rounded-xl group-hover:bg-red-500/20 transition-colors">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div className="space-y-1 pr-8">
                                        <h3 className="font-bold text-xs leading-tight text-foreground/90 line-clamp-2">{report.projectId?.name || "Projet Inconnu"}</h3>
                                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tight">
                                            {format(new Date(report.createdAt), 'dd MMM yyyy, HH:mm')}
                                        </p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        // TODO: Set separate delete confirmation for generated PDFs if needed
                                        api.delete(`/reports/${report._id}`).then(() => fetchGeneratedPDFs())
                                    }}
                                >
                                    <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* EDIT MODAL */}
            <Dialog open={!!editLog} onOpenChange={(open) => !open && setEditLog(null)}>
                <DialogContent className="max-w-xl bg-zinc-900 border-white/10 rounded-3xl backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-yellow-500" />
                            Corriger le rapport
                        </DialogTitle>
                    </DialogHeader>
                    
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Travaux réalisés</Label>
                            <Textarea 
                                value={editForm.workCompleted}
                                onChange={e => setEditForm(f => ({ ...f, workCompleted: e.target.value }))}
                                className="min-h-[160px] bg-zinc-800/50 border-white/5 rounded-2xl focus:ring-yellow-500/20 text-sm leading-relaxed"
                                placeholder="..."
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Ouvriers présents</Label>
                                <Input 
                                    type="number"
                                    value={editForm.workersPresent}
                                    onChange={e => setEditForm(f => ({ ...f, workersPresent: parseInt(e.target.value) || 0 }))}
                                    className="h-12 bg-zinc-800/50 border-white/5 rounded-2xl focus:ring-yellow-500/20 px-4 font-bold"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Observations / Problèmes</Label>
                                <Input 
                                    value={editForm.issues}
                                    onChange={e => setEditForm(f => ({ ...f, issues: e.target.value }))}
                                    className="h-12 bg-zinc-800/50 border-white/5 rounded-2xl focus:ring-yellow-500/20 px-4 text-sm"
                                    placeholder="Aucun point particulier"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notes (internes)</Label>
                            <Input 
                                value={editForm.notes}
                                onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                className="h-12 bg-zinc-800/50 border-white/5 rounded-2xl focus:ring-yellow-500/20 px-4 text-sm"
                                placeholder="..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button variant="ghost" onClick={() => setEditLog(null)} className="rounded-xl h-12 uppercase font-black text-[10px] tracking-widest">
                            Annuler
                        </Button>
                        <Button 
                            className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-black font-bold h-12 rounded-xl"
                            onClick={handleUpdateLog}
                            disabled={saving}
                        >
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "ENREGISTRER LES MODIFICATIONS"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* DELETE ALERT */}
            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="bg-zinc-900 border-white/10 rounded-3xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-xl font-bold">Supprimer cette entrée ?</AlertDialogTitle>
                        <AlertDialogDescription className="text-sm text-muted-foreground">
                            Cette action supprimera définitivement le rapport journalier sélectionné. Les doublons seront nettoyés du système.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl border-white/10 h-12 font-bold uppercase text-[10px] tracking-widest">Annuler</AlertDialogCancel>
                        <AlertDialogAction 
                            onClick={handleDeleteLog} 
                            disabled={deleting}
                            className="rounded-xl bg-red-600 hover:bg-red-700 h-12 font-bold flex-1"
                        >
                            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "OUI, SUPPRIMER L'ENTRÉE"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
