"use client"

import { useEffect, useState } from "react"
import { KPICard } from "@/components/dashboard/kpi-card"
import { ProjectTable } from "@/components/dashboard/project-table"
import { ActivityChart } from "@/components/dashboard/activity-chart"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FolderKanban, Banknote, Package, AlertTriangle, Plus, TrendingUp, Loader2, Users } from "lucide-react"
import { ErrorBoundary } from "@/components/error-boundary"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { toast } from "sonner"
import type { UserRole } from "@/lib/auth-context"

interface Project {
  _id: string
  name: string
  managerId: {
    _id: string
    name: string
    email: string
  }
  progress: number
  status: "active" | "on-hold" | "completed" | "delayed"
  budget: number
  endDate: string
}

interface Alert {
  _id: string
  message: string
  type: "info" | "warning" | "success" | "error"
  createdAt: string
  read: boolean
}

export default function AdminDashboard() {
  const { user } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    activeProjects: 0,
    totalBudget: 0,
    delayedProjects: 0,
    activeWorkers: 0,
    totalProjects: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return

      try {
        setLoading(true)

        // Fetch Stats
        const statsRes = await api.get("/admin/stats")
        if (statsRes.data.success) {
          const data = statsRes.data.data;
          setStats({
            activeProjects: data.projects.active,
            totalBudget: data.budget.total,
            delayedProjects: data.projects.delayed,
            activeWorkers: data.workers.active,
            totalProjects: data.projects.total
          });
        }

        // Fetch Projects (active items for table)
        // Ideally backend provides filtered list, but using existing endpoint for now
        const projectsRes = await api.get("/projects")
        setProjects(projectsRes.data.data)

        // Fetch Notifications
        const alertsRes = await api.get(`/notifications/${user.id}`)
        setAlerts(alertsRes.data.data)

      } catch (error) {
        console.error("Dashboard fetch error:", error)
        toast.error("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user])

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Map database projects to table format
  const tableProjects = projects.map(p => ({
    id: p._id,
    name: p.name,
    manager: p.managerId?.name || "Unassigned",
    progress: p.progress || 0,
    status: p.status,
    budget: `${(p.budget || 0).toLocaleString()} TND`,
    dueDate: new Date(p.endDate).toLocaleDateString()
  }))

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Welcome back, {user?.name}! Here&apos;s your project overview.</p>
          </div>
          <Button className="bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98] transition-all">
            <Plus className="mr-2 h-4 w-4" />
            New Project
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KPICard
            title="Total Budget"
            value={`${(stats.totalBudget / 1000).toFixed(1)}k TND`}
            change={0}
            changeLabel="total allocation"
            icon={Banknote}
            variant="default"
          />
          <KPICard
            title="Active Workers"
            value={stats.activeWorkers}
            change={0}
            changeLabel="currently on site"
            icon={Users}
            variant="info"
          />
          <KPICard
            title="Delayed Projects"
            value={stats.delayedProjects}
            change={0}
            changeLabel="needs attention"
            icon={AlertTriangle}
            variant="warning"
          />
          <KPICard
            title="Total Projects"
            value={stats.totalProjects}
            change={0}
            changeLabel="in portfolio"
            icon={Package}
            variant="success"
          />
        </div>

        {/* Charts and Alerts */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ActivityChart />
          </div>
          <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <TrendingUp className="h-5 w-5 text-primary" />
                Recent Alerts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.length > 0 ? (
                alerts.slice(0, 5).map((alert) => (
                  <div
                    key={alert._id}
                    className="flex items-start gap-3 rounded-lg border border-border/50 bg-muted/30 p-3 transition-colors hover:bg-muted/50"
                  >
                    <AlertTriangle
                      className={`h-5 w-5 shrink-0 mt-0.5 ${alert.type === "warning" ? "text-primary" : "text-secondary"}`}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm leading-tight">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(alert.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No recent alerts</p>
              )}

              <Button variant="ghost" className="w-full mt-2 text-primary hover:text-primary/80">
                View All Alerts
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Projects Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-xl font-semibold">Active Projects</h2>
            <Button variant="outline" size="sm" className="border-border/50 bg-transparent">
              View All
            </Button>
          </div>
          <ProjectTable projects={tableProjects.slice(0, 5)} />
        </div>
      </div>
    </ErrorBoundary>
  )
}
