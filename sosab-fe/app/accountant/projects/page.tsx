"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"
import { FolderKanban, MapPin, ChevronRight, AlertCircle, Package, CalendarDays, DollarSign } from "lucide-react"
import { Badge } from "@/components/ui/badge"

export default function AccountantProjects() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get("/projects")
        if (res.data.success) setProjects(res.data.data)
      } catch {
        toast.error("Impossible de charger les projets")
      } finally {
        setLoading(false)
      }
    }
    if (user) fetchProjects()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <FolderKanban className="h-8 w-8 text-amber-500 animate-spin" />
          <p className="text-sm text-muted-foreground">Chargement des projets...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-2xl font-bold">Mes Projets</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {projects.length} projet{projects.length > 1 ? "s" : ""} assigné{projects.length > 1 ? "s" : ""}
        </p>
      </div>

      {projects.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 gap-3">
          <AlertCircle className="h-10 w-10 text-muted-foreground/30" />
          <p className="text-muted-foreground font-medium">Aucun projet assigné</p>
          <p className="text-xs text-muted-foreground/60">Contactez votre administrateur pour obtenir l'accès à des projets</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {projects.map((project, index) => (
            <Link
              key={project._id}
              href={`/accountant/projects/${project._id}`}
              className="group block"
              style={{ animationDelay: `${index * 80}ms` }}
            >
              <div className="rounded-2xl border border-border bg-card p-6 relative overflow-hidden transition-all duration-300 hover:border-amber-500/40 hover:shadow-xl hover:shadow-amber-500/5 hover:-translate-y-0.5">
                {/* Accent bar */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-500/10 rounded-l-2xl" />

                <div className="pl-3">
                  <div className="flex items-start justify-between mb-4">
                    <Badge
                      variant="outline"
                      className="text-[10px] font-semibold uppercase tracking-wider border-amber-500/30 text-amber-600 bg-amber-500/5"
                    >
                      {project.status || "Actif"}
                    </Badge>
                    <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-amber-500 transition-colors" />
                  </div>

                  <h2 className="font-bold text-lg leading-tight mb-1 group-hover:text-amber-500 transition-colors">
                    {project.name}
                  </h2>

                  {project.location && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
                      <MapPin className="h-3.5 w-3.5 text-amber-500/70" />
                      <span className="truncate">{project.location}</span>
                    </div>
                  )}

                  {project.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mb-4">
                      {project.description}
                    </p>
                  )}

                  <div className="grid grid-cols-3 gap-2 pt-4 border-t border-border/50">
                    {[
                      { icon: Package, label: "Matériaux" },
                      { icon: CalendarDays, label: "Présences" },
                      { icon: DollarSign, label: "Salaires" },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className="flex flex-col items-center gap-1 p-2 rounded-xl bg-muted/30 hover:bg-amber-500/5 transition-colors"
                      >
                        <stat.icon className="h-4 w-4 text-amber-500/70" />
                        <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-medium">
                          {stat.label}
                        </span>
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
  )
}
