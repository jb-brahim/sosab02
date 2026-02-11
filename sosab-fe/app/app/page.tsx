"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { HardHat, ChevronRight, MapPin, FileText } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import Link from "next/link"

export default function MobileHome() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return "Good morning"
    if (hour < 18) return "Good afternoon"
    return "Good evening"
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('/projects')
        if (res.data.success) {
          setProjects(res.data.data)
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchData()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-pulse">
          <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <HardHat className="h-6 w-6 text-primary animate-spin" />
          </div>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Loading System...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden pb-24 gpu">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
      <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/2 rounded-full blur-2xl pointer-events-none" />

      <div className="p-4 space-y-8 relative z-10">
        {/* Hero Section */}
        <div className="flex items-center justify-between pt-2 animate-in">
          <div>
            <p className="text-sm text-muted-foreground font-medium mb-0.5 uppercase tracking-wide opacity-80">{getGreeting()},</p>
            <h1 className="font-display text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {user?.name?.split(" ")[0] || "Manager"}
            </h1>
          </div>
          <div className="glass h-14 w-14 flex items-center justify-center rounded-2xl shadow-xl shadow-black/5 ring-1 ring-white/10">
            <HardHat className="h-7 w-7 text-primary drop-shadow-md" />
          </div>
        </div>

        {/* Quick Stats - Command Center */}
        <div className="grid grid-cols-2 gap-3 animate-in delay-100">
          <div className="glass-card rounded-xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <FileText className="w-12 h-12" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider z-10">Active Projects</span>
            <div className="flex items-end gap-2 z-10">
              <span className="text-4xl font-bold font-display text-foreground">{projects.length}</span>
              <span className="text-xs text-primary mb-1.5 font-medium">+ New</span>
            </div>
          </div>
          <div className="glass-card rounded-xl p-4 flex flex-col justify-between h-28 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
              <MapPin className="w-12 h-12" />
            </div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider z-10">Total Sites</span>
            <div className="flex items-end gap-2 z-10">
              <span className="text-4xl font-bold font-display text-foreground">{projects.length}</span>
              <span className="text-xs text-muted-foreground mb-1.5">Locations</span>
            </div>
          </div>
        </div>

        {/* Active Projects List */}
        <div className="space-y-4 animate-in delay-200">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm font-bold text-foreground uppercase tracking-widest flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary glow-primary"></span>
              Current Operations
            </h2>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 glass rounded-2xl border-dashed">
              <p className="text-muted-foreground text-sm">No active operations assigned.</p>
            </div>
          ) : (
            <div className="space-y-4" style={{ contentVisibility: 'auto' } as any}>
              {projects.map((project, index) => (
                <Link href={`/app/projects/${project._id}`} key={project._id} className="block group gpu will-change-transform">
                  <div
                    className="glass-card rounded-2xl p-0 overflow-hidden relative transition-all duration-300 active:scale-[0.98] group-hover:border-primary/30"
                    style={{ animationDelay: `${(index + 3) * 100}ms` }}
                  >
                    {/* Status Bar */}
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary to-primary/20"></div>

                    <div className="p-5 pl-7">
                      <div className="flex justify-between items-start mb-3">
                        <ChevronRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                      </div>

                      <h3 className="font-display text-lg font-bold leading-tight mb-2 group-hover:text-primary transition-colors">
                        {project.name}
                      </h3>

                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <MapPin className="h-3.5 w-3.5 text-primary/70" />
                        <span className="font-medium">{project.location}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
