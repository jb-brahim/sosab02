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
        <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-300">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" />
                    Récapitulatif des Salaires
                </h1>
                <p className="text-muted-foreground text-xs mt-0.5">
                    Consultez le total des salaires par projet et par équipe sur une période donnée.
                </p>
            </div>

            <Card className="border-border/40 shadow-sm">
                <CardContent className="p-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="project" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Sélection du Chantier</Label>
                            <select 
                                id="project"
                                className="flex h-10 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-xs ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            >
                                <option value="">Choisir un projet...</option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="startDate" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date Début</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                className="h-10 text-xs rounded-xl"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="endDate" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Date Fin</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                className="h-10 text-xs rounded-xl"
                            />
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleFetchSummary}
                        disabled={fetching || loading}
                        className="w-full md:w-auto h-10 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6"
                    >
                        {fetching ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Chargement...
                            </>
                        ) : (
                            <>
                                <Search className="w-4 h-4 mr-2" />
                                Afficher le récapitulatif
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>

            {summaryData && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                    <Card className="border-border/40 shadow-sm bg-primary/5 border-primary/20">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total des Salaires</h2>
                            <div className="text-4xl font-black text-primary">
                                {summaryData.grandTotal.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-2">
                                Pour le projet <span className="font-bold text-foreground">{summaryData.project.name}</span>
                            </p>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/80 pl-1">Détails par équipe</h3>
                        
                        {summaryData.groups.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/30">
                                Aucune donnée trouvée pour cette période.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {summaryData.groups.map((group: any, index: number) => (
                                    <Card key={index} className={`border-border/40 shadow-sm transition-all hover:border-primary/30 ${group.isDirect ? 'bg-blue-500/5' : ''}`}>
                                        <CardContent className="p-5 flex items-center justify-between">
                                            <div>
                                                <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-1">
                                                    {group.isDirect ? 'Équipe Directe' : 'Sous-traitant'}
                                                </div>
                                                <div className="font-bold text-base text-foreground">
                                                    {group.name}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="font-black text-lg text-primary">
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
