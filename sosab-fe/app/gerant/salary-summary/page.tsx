"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Wallet, Search } from "lucide-react"
import { toast } from "sonner"

export default function SalarySummaryPage() {
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [summaryData, setSummaryData] = useState<any>(null)

    const [formData, setFormData] = useState({
        projectId: "",
        startDate: "",
        endDate: ""
    })

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true)
                const res = await api.get('/projects')
                if (res.data.success) {
                    setProjects(res.data.data)
                }
            } catch (error) {
                console.error("Failed to load projects", error)
                toast.error("Impossible de charger les projets")
            } finally {
                setLoading(false)
            }
        }
        fetchProjects()
    }, [])

    const handleFetchSummary = async () => {
        if (!formData.projectId) {
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
            setFetching(true)
            const res = await api.get(`/reports/salary-summary`, {
                params: {
                    projectId: formData.projectId,
                    startDate: formData.startDate,
                    endDate: formData.endDate
                }
            })

            if (res.data.success) {
                setSummaryData(res.data.data)
                toast.success("Données récupérées avec succès")
            }
        } catch (error: any) {
            console.error("Failed to fetch salary summary", error)
            toast.error(error.response?.data?.message || "Échec de la récupération des données")
            setSummaryData(null)
        } finally {
            setFetching(false)
        }
    }

    return (
        <div className="space-y-8 max-w-4xl mx-auto pb-24 animate-in fade-in duration-300 px-2 sm:px-0">
            <div className="text-center sm:text-left">
                <h1 className="text-3xl font-black tracking-tight text-foreground flex items-center justify-center sm:justify-start gap-3">
                    <Wallet className="h-8 w-8 text-primary" />
                    Récapitulatif des Salaires
                </h1>
                <p className="text-muted-foreground text-sm mt-2 font-medium">
                    Consultez simplement le total des salaires par projet et par équipe.
                </p>
            </div>

            <Card className="border-border/50 shadow-lg bg-card/95 backdrop-blur-sm rounded-2xl overflow-hidden">
                <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="project" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Sélection du Chantier</Label>
                            <select 
                                id="project"
                                className="flex h-14 w-full items-center justify-between rounded-xl border-2 border-muted bg-background px-4 py-2 text-sm font-semibold ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-50 transition-colors cursor-pointer"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            >
                                <option value="">Choisir un projet...</option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="startDate" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date de Début</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="h-14 text-sm font-semibold rounded-xl border-2 border-muted focus:border-primary px-4 cursor-pointer"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Date de Fin</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="h-14 text-sm font-semibold rounded-xl border-2 border-muted focus:border-primary px-4 cursor-pointer"
                            />
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleFetchSummary}
                        disabled={fetching || loading}
                        className="w-full h-14 text-sm sm:text-base font-black uppercase tracking-widest bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-md shadow-primary/20 transition-all active:scale-[0.98]"
                    >
                        {fetching ? (
                            <>
                                <div className="h-5 w-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-3" />
                                Calcul en cours...
                            </>
                        ) : (
                            <>
                                <Search className="w-5 h-5 mr-3" />
                                Afficher le Résultat
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {summaryData && (
                <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
                    <Card className="border-primary/40 shadow-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-primary/50" />
                        <CardContent className="p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                            <h2 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-3">Total des Salaires</h2>
                            <div className="text-5xl sm:text-6xl font-black text-primary drop-shadow-sm tracking-tight">
                                {summaryData.grandTotal.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
                            </div>
                            <p className="text-sm text-muted-foreground mt-4 font-medium max-w-md">
                                Période sélectionnée pour le chantier <br/>
                                <span className="font-bold text-foreground text-base">{summaryData.project.name}</span>
                            </p>
                        </CardContent>
                    </Card>

                    <div className="space-y-4">
                        <h3 className="font-black text-lg uppercase tracking-wider text-foreground/80 pl-2">Détails par équipe</h3>
                        
                        {summaryData.groups.length === 0 ? (
                            <div className="p-8 text-center text-muted-foreground bg-card/50 rounded-2xl border-2 border-dashed border-border/50 font-medium">
                                Aucune donnée de présence ou de salaire trouvée pour cette période.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {summaryData.groups.map((group: any, index: number) => (
                                    <Card key={index} className={`border-border/50 shadow-md rounded-2xl transition-all hover:border-primary/40 hover:shadow-lg ${group.isDirect ? 'bg-blue-500/5 border-blue-500/20' : 'bg-card'}`}>
                                        <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-widest font-bold mb-1.5">
                                                    {group.isDirect ? 'Équipe Directe' : 'Sous-traitant'}
                                                </div>
                                                <div className="font-black text-lg text-foreground">
                                                    {group.name}
                                                </div>
                                            </div>
                                            <div className="text-left sm:text-right">
                                                <div className="font-black text-2xl text-primary">
                                                    {group.total.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
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
