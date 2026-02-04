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
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-muted-foreground">{getGreeting()},</p>
          <h1 className="font-display text-2xl font-bold">{user?.name || "Manager"}</h1>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
          <HardHat className="h-6 w-6 text-primary-foreground" />
        </div>
      </div>

      {/* Quick Actions */}


      {/* Active Projects */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Your Projects</h2>
          <Badge variant="secondary" className="text-xs font-normal">
            {projects.length} Active
          </Badge>
        </div>

        {projects.length === 0 ? (
          <div className="text-center py-8 border-2 border-dashed rounded-lg bg-muted/10">
            <p className="text-muted-foreground text-sm">No projects assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((project) => (
              <Card
                key={project._id}
                className="border-border/50 bg-card/80 backdrop-blur-sm transition-all active:scale-[0.99] overflow-hidden"
              >
                <div className={`h-1 ${project.status === 'Active' ? 'bg-gradient-to-r from-primary to-primary/50' : 'bg-muted'}`} />
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{project.name}</h3>
                        <Badge
                          variant="outline"
                          className="border-primary/30 bg-primary/10 text-primary text-[10px] px-1.5"
                        >
                          {project.status || 'Active'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {project.location}
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-3 w-full justify-between hover:bg-muted/50" asChild>
                    <Link href={`/app/projects/${project._id}`}>
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
