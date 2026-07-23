"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Search, ArrowLeft, Building2, Calendar, Users, Briefcase } from "lucide-react"
import { toast } from "sonner"

export default function OwnerProjectSalarySummaryPage() {
    const params = useParams()
    const router = useRouter()
    const projectId = params?.projectId as string

    const [project, setProject] = useState<any>(null)
    const [loadingProject, setLoadingProject] = useState(true)
    const [fetching, setFetching] = useState(false)
    const [summaryData, setSummaryData] = useState<any>(null)

    // Default dates: start of current month to today
    const [startDate, setStartDate] = useState(() => {
        const d = new Date()
        return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
    })
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0]
    })

    useEffect(() => {
        const fetchProjectDetails = async () => {
            if (!projectId) return
            try {
                setLoadingProject(true)
                const res = await api.get(`/projects/${projectId}`)
                if (res.data.success) {
                    setProject(res.data.data)
                }
            } catch (error) {
                console.error("Failed to load project details", error)
                toast.error("Impossible de charger les détails du projet")
            } finally {
                setLoadingProject(false)
            }
        }
        fetchProjectDetails()
    }, [projectId])

    const handleFetchSummary = async () => {
        if (!startDate || !endDate) {
            toast.error("Veuillez choisir une période de dates")
            return
        }

        const start = new Date(startDate)
        const end = new Date(endDate)

        if (start > end) {
            toast.error("La date de début doit être antérieure à la date de fin")
            return
        }

        try {
            setFetching(true)
            const res = await api.get(`/reports/salary-summary`, {
                params: {
                    projectId,
                    startDate,
                    endDate
                }
            })

            if (res.data.success) {
                setSummaryData(res.data.data)
                toast.success("Données calculées avec succès")
            }
        } catch (error: any) {
            console.error("Failed to fetch salary summary", error)
            toast.error(error.response?.data?.message || "Échec de la récupération des données")
            setSummaryData(null)
        } finally {
            setFetching(false)
        }
    }

    if (loadingProject) {
        return (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-sm font-medium text-muted-foreground">Chargement du chantier...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-300 px-4 sm:px-0">
            {/* Header with Back Button */}
            <div className="flex items-center gap-3">
                <Button 
                    variant="outline" 
                    size="icon" 
                    onClick={() => router.push('/owner/salary-summary')}
                    className="rounded-xl h-10 w-10 shrink-0 border-border/60 hover:bg-muted"
                >
                    <ArrowLeft className="h-5 w-5 text-foreground" />
                </Button>
                <div>
                    <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground line-clamp-1">
                        {project?.name || "Détail du Chantier"}
                    </h1>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                        <Building2 className="h-3.5 w-3.5 text-primary" />
                        {project?.location || "Localisation non spécifiée"}
                    </p>
                </div>
            </div>

            {/* Date Selection Form */}
            <Card className="border-border/50 shadow-md bg-card/90 rounded-2xl overflow-hidden">
                <CardContent className="p-5 sm:p-6 space-y-5">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-foreground border-b border-border/40 pb-3">
                        <Calendar className="h-4 w-4 text-primary" />
                        <span>Sélectionner la Période</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="startDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Date Début
                            </Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={startDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)}
                                className="h-12 text-sm rounded-xl bg-background border-border/60"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="endDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                                Date Fin
                            </Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={endDate}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)}
                                className="h-12 text-sm rounded-xl bg-background border-border/60"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={handleFetchSummary}
                        disabled={fetching}
                        className="w-full h-13 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {fetching ? (
                            <>
                                <div className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                                Calcul en cours...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                Rechercher le Récapitulatif
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {/* Results Display */}
            {summaryData && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    {/* Total Salary Card */}
                    <Card className="border-primary/30 shadow-lg bg-gradient-to-br from-primary/10 via-primary/5 to-card rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-primary" />
                        <CardContent className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
                            <div className="flex items-center gap-2 text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
                                <Wallet className="h-4 w-4 text-primary" />
                                Total des Salaires
                            </div>
                            <div className="text-4xl sm:text-5xl font-black text-primary tracking-tight">
                                {summaryData.grandTotal.toLocaleString('fr-TN', { style: 'currency', currency: 'TND' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3 font-medium">
                                Du <span className="font-bold text-foreground">{new Date(startDate).toLocaleDateString('fr-FR')}</span> au <span className="font-bold text-foreground">{new Date(endDate).toLocaleDateString('fr-FR')}</span>
                            </p>
                        </CardContent>
                    </Card>

                    {/* Breakdown by Team */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2 pl-1">
                            <Users className="h-4 w-4 text-primary" />
                            <h3 className="font-bold text-sm uppercase tracking-wider text-foreground">
                                Détails par Équipe & Sous-traitant
                            </h3>
                        </div>

                        {summaryData.groups.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground bg-card rounded-2xl border border-dashed border-border/50 font-medium text-sm">
                                Aucune présence enregistrée sur ce chantier pendant cette période.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {summaryData.groups.map((group: any, index: number) => (
                                    <Card 
                                        key={index} 
                                        className={`border-border/50 shadow-sm rounded-2xl transition-all ${
                                            group.isDirect 
                                                ? 'bg-blue-500/5 border-blue-500/20' 
                                                : 'bg-card hover:border-border'
                                        }`}
                                    >
                                        <CardContent className="p-5 flex items-center justify-between gap-3">
                                            <div className="space-y-1">
                                                <div className="flex items-center gap-1.5">
                                                    <Briefcase className="h-3.5 w-3.5 text-muted-foreground" />
                                                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                                        {group.isDirect ? 'Équipe Directe' : 'Sous-traitant'}
                                                    </span>
                                                </div>
                                                <div className="font-bold text-base text-foreground line-clamp-2">
                                                    {group.name}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <div className="font-black text-xl text-primary">
                                                    {group.total.toLocaleString('fr-TN', { style: 'currency', currency: 'TND' })}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
