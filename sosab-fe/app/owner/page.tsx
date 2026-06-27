"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import {
  FolderKanban,
  ChevronRight,
  MapPin,
  AlertCircle,
  Shield,
  Activity,
  Users,
  FileText,
  DollarSign
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function OwnerDashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/projects")
        if (res.data.success) {
          setProjects(res.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch projects", error)
        toast.error("Impossible de charger les projets")
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-2xl bg-primary/20 flex items-center justify-center">
            <FolderKanban className="h-6 w-6 text-primary animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Welcome Header */}
      <div className="flex items-start justify-between bg-card p-6 rounded-2xl border border-border/50 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 h-full w-1/3 bg-gradient-to-l from-primary/5 to-transparent pointer-events-none" />
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground font-semibold uppercase tracking-widest">
            Propriétaire & Directeur
          </p>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Bonjour, {user?.name || "Super Admin"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Vue d'ensemble et contrôle total sur <span className="text-primary font-semibold">{projects.length} projet{projects.length > 1 ? "s" : ""}</span>.
          </p>
        </div>
        <Badge className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-1.5 px-3 border-none flex items-center gap-1.5 shadow-md">
          <Shield className="h-4 w-4" />
          Super Admin
        </Badge>
      </div>

      {/* Main Action Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Gérer les Managers", href: "/owner/managers", icon: Users, color: "purple" },
          { label: "Consulter les Logs", href: "/owner/logs", icon: Activity, color: "blue" },
          { label: "Rapports & Finances", href: "/owner/reports", icon: FileText, color: "amber" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-4 rounded-2xl border border-border/50 bg-card p-5 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 group shadow-sm hover:shadow-md cursor-pointer"
          >
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 duration-300 ${
              action.color === 'purple' ? 'bg-primary/10 text-primary' :
              action.color === 'blue' ? 'bg-blue-500/10 text-blue-500' :
              'bg-amber-500/10 text-amber-500'
            }`}>
              <action.icon className="h-5.5 w-5.5" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm text-foreground/90 group-hover:text-primary transition-colors">{action.label}</span>
              <span className="text-[10px] text-muted-foreground mt-0.5">Accès d'écriture total</span>
            </div>
            <ChevronRight className="h-4.5 w-4.5 ml-auto text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </Link>
        ))}
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-primary" />
          Liste des Chantiers Actifs
        </h2>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Aucun projet actif sur la plateforme</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map((project, index) => (
              <div
                key={project._id}
                className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden transition-all duration-300 shadow-sm hover:shadow-md hover:border-primary/30"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                {/* Status Indicator */}
                <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-primary/20 rounded-l-2xl" />

                <div className="pl-3 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="font-extrabold text-lg leading-tight text-foreground/90">
                        {project.name}
                      </h3>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary/70" />
                        <span className="truncate">{project.location || "—"}</span>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-[9px] font-bold uppercase px-2 py-0.5 border-primary/30 text-primary bg-primary/5">
                      {project.status || "Actif"}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs pt-3 border-t border-border/50">
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Budget du projet</span>
                      <div className="font-bold flex items-center gap-1 text-foreground">
                        <DollarSign className="w-3.5 h-3.5 text-primary" />
                        {project.budget?.toLocaleString() || "0"} TND
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase font-semibold">Managers assignés</span>
                      <div className="font-semibold text-foreground/95 truncate">
                        {project.managers && project.managers.length > 0 ? (
                          project.managers.map((m: any) => m.name).join(", ")
                        ) : (
                          <span className="text-muted-foreground italic font-normal">Aucun manager</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Clean progress display (No charts) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex justify-between text-[10px] uppercase font-bold text-muted-foreground">
                      <span>Progression des travaux</span>
                      <span className="text-foreground">{project.progress || 0}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
                        style={{ width: `${project.progress || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
