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
        <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-300 px-4 sm:px-0">
            <div>
                <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
                    <Wallet className="h-6 w-6 text-primary" />
                    Récapitulatif des Salaires
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                    Consultez simplement le total des salaires par projet et par équipe.
                </p>
            </div>

            <Card className="border-border/40 shadow-sm">
                <CardContent className="p-5 space-y-5">
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="project" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Sélection du Chantier</Label>
                            <select 
                                id="project"
                                className="flex h-12 w-full items-center justify-between rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={formData.projectId}
                                onChange={(e) => setFormData({ ...formData, projectId: e.target.value })}
                            >
                                <option value="">Choisir un projet...</option>
                                {projects.map((p) => (
                                    <option key={p._id} value={p._id}>{p.name.length > 40 ? p.name.substring(0, 40) + '...' : p.name}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="startDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date Début</Label>
                                <Input
                                    id="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="h-12 text-sm rounded-xl"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="endDate" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date Fin</Label>
                                <Input
                                    id="endDate"
                                    type="date"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    className="h-12 text-sm rounded-xl"
                                />
                            </div>
                        </div>
                    </div>
                    
                    <Button
                        onClick={handleFetchSummary}
                        disabled={fetching || loading}
                        className="w-full h-12 text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl px-6 mt-2"
                    >
                        {fetching ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Calcul...
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
                    <Card className="border-primary/20 shadow-md bg-primary/5">
                        <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-2">Total des Salaires</h2>
                            <div className="text-4xl font-black text-primary">
                                {summaryData.grandTotal.toLocaleString('fr-DZ', { style: 'currency', currency: 'DZD' })}
                            </div>
                            <p className="text-xs text-muted-foreground mt-3">
                                Pour le projet <br/>
                                <span className="font-bold text-foreground text-sm">{summaryData.project.name}</span>
                            </p>
                        </CardContent>
                    </Card>

                    <div className="space-y-3">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-foreground/80 pl-1">Détails par équipe</h3>
                        
                        {summaryData.groups.length === 0 ? (
                            <div className="p-6 text-center text-muted-foreground bg-muted/5 rounded-xl border border-dashed border-border/30">
                                Aucune donnée trouvée.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 gap-3">
                                {summaryData.groups.map((group: any, index: number) => (
                                    <Card key={index} className={`border-border/40 shadow-sm ${group.isDirect ? 'bg-blue-500/5' : ''}`}>
                                        <CardContent className="p-4 flex items-center justify-between">
                                            <div className="pr-2">
                                                <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold mb-1">
                                                    {group.isDirect ? 'Équipe Directe' : 'Sous-traitant'}
                                                </div>
                                                <div className="font-bold text-sm text-foreground line-clamp-2">
                                                    {group.name}
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
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
