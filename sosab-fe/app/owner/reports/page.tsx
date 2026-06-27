"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, Calendar, ArrowLeft, FileSpreadsheet, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useLanguage } from "@/lib/language-context"
import { MultiSelect } from "@/components/ui/multi-select"
import { format } from "date-fns"
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

export default function OwnerReportsPage() {
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

    const [deleteId, setDeleteId] = useState<string | null>(null)

    const handleDeleteReport = async () => {
        if (!deleteId) return
        try {
            await api.delete(`/reports/${deleteId}`)
            setRecentReports(prev => prev.filter(r => r._id !== deleteId))
            toast.success("Rapport supprimé avec succès")
        } catch (error) {
            console.error("Failed to delete report", error)
            toast.error("Échec de la suppression")
        } finally {
            setDeleteId(null)
        }
    }

    const fetchRecentReports = async () => {
        try {
            const reportsRes = await api.get('/reports')
            if (reportsRes.data.success) {
                const sortedReports = reportsRes.data.data
                    .filter((r: any) => r.type !== 'activity')
                    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                setRecentReports(sortedReports)
            }
        } catch (error) {
            console.error("Failed to load recent reports", error)
        }
    }

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [projectsRes] = await Promise.all([
                    api.get('/projects'),
                    fetchRecentReports()
                ])
                if (projectsRes.data.success) {
                    setProjects(projectsRes.data.data)
                }
            } catch (error) {
                console.error("Failed to load page data", error)
                toast.error("Impossible de charger les projets")
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [])

    const handleGenerate = async () => {
        if (formData.projectIds.length === 0) {
            toast.error("Veuillez sélectionner un projet")
            return
        }
        if (!formData.startDate || !formData.endDate) {
            toast.error("Veuillez choisir une période de dates")
            return
        }

        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)

        if (start > end) {
            toast.error("La date de début doit être antérieure à la date de fin")
            return
        }

        try {
            setGenerating(true)
            const res = await api.post('/reports/generate', {
                ...formData,
                projectId: formData.projectIds[0],
            })

            if (res.data.success) {
                toast.success("Rapport généré avec succès !")

                // Download the file
                const apiUrl = require('@/lib/api').BACKEND_URL;
                const downloadUrl = `${apiUrl}${res.data.data.pdfUrl}`
                window.open(downloadUrl, '_blank')

                // Refresh recent reports
                fetchRecentReports()
            }
        } catch (error: any) {
            console.error("Failed to generate report", error)
            toast.error(error.response?.data?.message || "Échec de la génération du rapport")
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-300">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <FileText className="h-6 w-6 text-purple-500" />
                    Générateur de Rapports
                </h1>
                <p className="text-muted-foreground text-xs mt-0.5">
                    Générez des grilles de présence ou des récapitulatifs de paiements pour les chantiers sélectionnés.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left side: Report form (7 columns) */}
                <div className="lg:col-span-7">
                    <Card className="border-border/40 shadow-sm h-full">
                        <CardContent className="p-5">
                            <div className="space-y-5">
                                {/* Project Selection */}
                                <div className="space-y-1.5">
                                    <Label htmlFor="project" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sélection du Chantier</Label>
                                    <MultiSelect
                                        options={projects.map(p => ({ label: p.name, value: p._id }))}
                                        selected={formData.projectIds}
                                        onChange={(vals) => setFormData({ ...formData, projectIds: vals })}
                                        placeholder="Choisir un projet..."
                                    />
                                </div>

                                {/* Date Range */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Période du Rapport</Label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-1">
                                            <Label htmlFor="startDate" className="text-[9px] font-bold text-muted-foreground/80 uppercase">Date Début</Label>
                                            <Input
                                                id="startDate"
                                                type="date"
                                                value={formData.startDate}
                                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                                className="h-10 text-xs rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor="endDate" className="text-[9px] font-bold text-muted-foreground/80 uppercase">Date Fin</Label>
                                            <Input
                                                id="endDate"
                                                type="date"
                                                value={formData.endDate}
                                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                                className="h-10 text-xs rounded-xl"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Report Type */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Type de Rapport</Label>
                                    <RadioGroup
                                        value={formData.type}
                                        onValueChange={(value) => setFormData({ ...formData, type: value })}
                                        className="grid grid-cols-1 gap-2 bg-muted/20 p-2.5 rounded-xl border border-border/30"
                                    >
                                        <div className="flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/40 transition-colors cursor-pointer">
                                            <RadioGroupItem value="attendance" id="attendance" />
                                            <Label htmlFor="attendance" className="font-semibold cursor-pointer text-xs">
                                                Présence (Grille quotidienne)
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 rounded-lg p-2 hover:bg-muted/40 transition-colors cursor-pointer">
                                            <RadioGroupItem value="payment" id="payment" />
                                            <Label htmlFor="payment" className="font-semibold cursor-pointer text-xs">
                                                Paiements (Sommaire financier)
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Format Selection */}
                                <div className="space-y-1.5">
                                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Format d'Export</Label>
                                    <RadioGroup
                                        value={formData.format}
                                        onValueChange={(value) => setFormData({ ...formData, format: value })}
                                        className="grid grid-cols-2 gap-3"
                                    >
                                        <div className="flex items-center space-x-2 rounded-xl border border-border/50 p-3 hover:bg-muted/40 transition-all cursor-pointer">
                                            <RadioGroupItem value="pdf" id="pdf" />
                                            <Label htmlFor="pdf" className="font-semibold cursor-pointer text-xs flex items-center gap-1.5">
                                                <FileText className="w-4 h-4 text-red-500" />
                                                PDF Imprimable
                                            </Label>
                                        </div>
                                        <div className="flex items-center space-x-2 rounded-xl border border-border/50 p-3 hover:bg-muted/40 transition-all cursor-pointer">
                                            <RadioGroupItem value="excel" id="excel" />
                                            <Label htmlFor="excel" className="font-semibold cursor-pointer text-xs flex items-center gap-1.5">
                                                <FileSpreadsheet className="w-4 h-4 text-green-500" />
                                                Excel Modifiable
                                            </Label>
                                        </div>
                                    </RadioGroup>
                                </div>

                                {/* Generate Button */}
                                <Button
                                    onClick={handleGenerate}
                                    disabled={generating || loading || formData.projectIds.length === 0}
                                    className="w-full h-11 text-xs font-bold uppercase bg-purple-600 hover:bg-purple-700 text-white rounded-xl"
                                    size="lg"
                                >
                                    {generating ? (
                                        <>
                                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                            Génération en cours...
                                        </>
                                    ) : (
                                        <>
                                            <Download className="w-4 h-4 mr-2" />
                                            Générer le document
                                        </>
                                    )}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right side: Recent reports (5 columns) */}
                <div className="lg:col-span-5">
                    <Card className="border-border/40 shadow-sm h-full flex flex-col min-h-[400px]">
                        <CardContent className="p-5 flex-1 flex flex-col space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="font-bold text-xs uppercase tracking-wider text-foreground/80">
                                    Rapports Récents
                                </h3>
                                <Button 
                                    variant="link" 
                                    size="sm" 
                                    onClick={() => router.push('/owner/reports/history')} 
                                    className="h-auto p-0 text-purple-600 hover:text-purple-700 font-bold text-xs"
                                >
                                    Voir tout
                                </Button>
                            </div>
                            
                            {loading ? (
                                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center text-muted-foreground animate-pulse text-xs font-medium">
                                    <div className="h-6 w-6 border-2 border-purple-600 border-t-transparent rounded-full animate-spin mb-2" />
                                    Chargement...
                                </div>
                            ) : recentReports.length === 0 ? (
                                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/30">
                                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-25 text-muted-foreground" />
                                    <span className="text-xs font-bold text-foreground/80">Aucun rapport généré</span>
                                    <span className="text-[10px] opacity-60 mt-1">Vos rapports apparaîtront ici après génération.</span>
                                </div>
                            ) : (
                                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[350px] pr-1">
                                    {recentReports.map((report) => (
                                        <div 
                                            key={report._id} 
                                            className="p-2.5 rounded-xl bg-muted/5 border border-border/40 hover:border-purple-500/20 hover:bg-purple-500/5 transition-all flex items-center justify-between cursor-pointer group"
                                            onClick={() => {
                                                const apiUrl = require('@/lib/api').BACKEND_URL;
                                                window.open(`${apiUrl}${report.pdfUrl}`, '_blank')
                                            }}
                                        >
                                            <div className="flex items-center gap-2 min-w-0">
                                                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg group-hover:bg-red-500/20 transition-colors">
                                                    <FileText className="w-3.5 h-3.5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="text-xs font-bold truncate text-foreground/90 group-hover:text-purple-600 transition-colors">
                                                        {report.projectId?.name || "Projet"}
                                                    </div>
                                                    <div className="text-[9px] text-muted-foreground flex items-center gap-1 mt-0.5">
                                                        <span className="uppercase font-semibold text-[8px] bg-muted/30 px-1 rounded">{report.type}</span>
                                                        <span>•</span>
                                                        <span>{format(new Date(report.createdAt), 'dd MMM, HH:mm')}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-0.5">
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-muted-foreground hover:text-purple-600 hover:bg-transparent"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        const apiUrl = require('@/lib/api').BACKEND_URL;
                                                        window.open(`${apiUrl}${report.pdfUrl}`, '_blank')
                                                    }}
                                                >
                                                    <Download className="w-3 h-3" />
                                                </Button>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-transparent"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDeleteId(report._id)
                                                    }}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent className="rounded-2xl border-white/5 bg-background/95 backdrop-blur-xl">
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
