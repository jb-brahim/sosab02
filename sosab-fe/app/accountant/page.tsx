"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import {
  FolderKanban,
  Package,
  CalendarDays,
  DollarSign,
  FileBarChart,
  ChevronRight,
  MapPin,
  TrendingUp,
  AlertCircle,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export default function AccountantDashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Bonjour"
    if (hour < 18) return "Bon après-midi"
    return "Bonsoir"
  }

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
    if (user) fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-2xl bg-amber-500/20 flex items-center justify-center">
            <FolderKanban className="h-6 w-6 text-amber-500 animate-spin" />
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
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">
            {getGreeting()},
          </p>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            {user?.name?.split(" ")[0] || "Comptable"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Vous avez accès à <span className="text-amber-500 font-semibold">{projects.length} projet{projects.length > 1 ? "s" : ""}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-600 border border-amber-500/20">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Comptable
          </span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-amber-500/30 transition-all duration-200 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Projets assignés
            </span>
            <div className="h-9 w-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
              <FolderKanban className="h-4.5 w-4.5 text-amber-500" />
            </div>
          </div>
          <div className="flex items-end gap-2">
            <span className="text-3xl font-bold font-mono">{projects.length}</span>
            <span className="text-xs text-muted-foreground mb-1">actifs</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Ajouter un matériau", href: "/accountant/materials", icon: Package, color: "amber" },
          { label: "Voir les présences", href: "/accountant/attendance", icon: CalendarDays, color: "green" },
          { label: "Générer un rapport", href: "/accountant/reports", icon: FileBarChart, color: "blue" },
        ].map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all duration-200 group"
          >
            <div className={`h-10 w-10 rounded-xl bg-${action.color}-500/10 flex items-center justify-center`}>
              <action.icon className={`h-5 w-5 text-${action.color}-500`} />
            </div>
            <span className="font-medium text-sm">{action.label}</span>
            <ChevronRight className="h-4 w-4 ml-auto text-muted-foreground group-hover:text-amber-500 transition-colors" />
          </Link>
        ))}
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold uppercase tracking-widest text-foreground flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            Mes Projets
          </h2>
          <Link href="/accountant/projects">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-amber-500">
              Voir tout
            </Button>
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 gap-3">
            <AlertCircle className="h-8 w-8 text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Aucun projet assigné</p>
            <p className="text-xs text-muted-foreground/60">Contactez votre administrateur</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {projects.map((project, index) => (
              <Link
                key={project._id}
                href={`/accountant/projects/${project._id}`}
                className="group block"
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="rounded-2xl border border-border bg-card p-5 relative overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-lg hover:shadow-amber-500/5">
                  {/* Accent bar */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-500/20 rounded-l-2xl" />

                  <div className="pl-3">
                    <div className="flex items-start justify-between mb-3">
                      <Badge
                        variant="outline"
                        className="text-[10px] font-semibold uppercase tracking-wider border-amber-500/30 text-amber-600 bg-amber-500/5"
                      >
                        {project.status || "Actif"}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-amber-500 transition-colors" />
                    </div>

                    <h3 className="font-bold text-base leading-tight mb-2 group-hover:text-amber-500 transition-colors">
                      {project.name}
                    </h3>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 text-amber-500/70" />
                      <span className="font-medium truncate">{project.location || "—"}</span>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2 pt-3 border-t border-border/50">
                      {[
                        { icon: Package, label: "Matériaux" },
                        { icon: CalendarDays, label: "Présences" },
                        { icon: DollarSign, label: "Salaires" },
                      ].map((stat) => (
                        <div key={stat.label} className="flex flex-col items-center gap-1">
                          <stat.icon className="h-3.5 w-3.5 text-muted-foreground/50" />
                          <span className="text-[9px] text-muted-foreground uppercase tracking-wider">{stat.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
