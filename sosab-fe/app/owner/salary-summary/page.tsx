"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Wallet, Search, Building2, MapPin, ChevronRight, HardHat } from "lucide-react"
import { toast } from "sonner"
import { useAuth } from "@/lib/auth-context"

export default function OwnerSalarySummarySelectionPage() {
    const { user } = useAuth()
    const router = useRouter()
    const [projects, setProjects] = useState<any[]>([])
    const [searchTerm, setSearchTerm] = useState("")
    const [loading, setLoading] = useState(true)

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
                toast.error("Impossible de charger la liste des chantiers")
            } finally {
                setLoading(false)
            }
        }
        fetchProjects()
    }, [])

    const filteredProjects = projects.filter(p => 
        p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.location?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6 max-w-4xl mx-auto pb-24 animate-in fade-in duration-300 px-4 sm:px-0">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground flex items-center gap-2.5">
                        <Wallet className="h-7 w-7 text-primary shrink-0" />
                        Récapitulatif des Salaires
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">
                        Sélectionnez un chantier pour consulter ses salaires
                    </p>
                </div>
            </div>

            {/* Search Input */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Rechercher un chantier par nom ou localisation..."
                    value={searchTerm}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                    className="h-13 pl-12 pr-4 text-sm rounded-2xl border-border/60 bg-card/80 backdrop-blur-sm shadow-sm focus:border-primary"
                />
            </div>

            {/* Projects List */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-16 space-y-3">
                    <div className="h-8 w-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-muted-foreground font-medium">Chargement des chantiers...</p>
                </div>
            ) : filteredProjects.length === 0 ? (
                <div className="text-center py-16 px-4 bg-card/50 rounded-2xl border border-dashed border-border/60 space-y-3">
                    <HardHat className="h-10 w-10 text-muted-foreground mx-auto opacity-50" />
                    <p className="text-sm font-bold text-foreground">Aucun chantier trouvé</p>
                    <p className="text-xs text-muted-foreground">Essayez un autre terme de recherche.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {filteredProjects.map((project) => (
                        <Card 
                            key={project._id}
                            onClick={() => router.push(`/owner/salary-summary/${project._id}`)}
                            className="border-border/50 shadow-sm bg-card hover:border-primary/50 hover:shadow-md transition-all duration-200 cursor-pointer rounded-2xl overflow-hidden group active:scale-[0.99]"
                        >
                            <CardContent className="p-5 flex items-center justify-between gap-4">
                                <div className="flex items-start gap-3.5 min-w-0">
                                    <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 border border-primary/20 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors duration-200">
                                        <Building2 className="h-5 w-5" />
                                    </div>
                                    <div className="space-y-1 min-w-0">
                                        <h3 className="font-bold text-base text-foreground leading-snug break-words group-hover:text-primary transition-colors">
                                            {project.name}
                                        </h3>
                                        {project.location && (
                                            <p className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                                                <MapPin className="h-3.5 w-3.5 text-primary/70 shrink-0" />
                                                <span className="truncate">{project.location}</span>
                                            </p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <span className="hidden sm:inline-block text-xs font-bold text-primary group-hover:underline">
                                        Voir Salaires
                                    </span>
                                    <div className="h-9 w-9 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                        <ChevronRight className="h-5 w-5" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}
