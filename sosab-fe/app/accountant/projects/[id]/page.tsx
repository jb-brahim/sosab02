"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api, { BACKEND_URL } from "@/lib/api"
import { toast } from "sonner"
import {
  Package,
  CalendarDays,
  DollarSign,
  FileBarChart,
  Plus,
  Minus,
  ArrowDownLeft,
  ArrowUpRight,
  Trash2,
  Pencil,
  ArrowLeft,
  MapPin,
  Loader2,
  ChevronDown,
  FileDown,
  FileSpreadsheet,
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CreateMaterialDialog } from "@/components/admin/create-material-dialog"
import { StockMovementDialog } from "@/components/admin/stock-movement-dialog"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type Tab = "materials" | "attendance" | "salary" | "reports"

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: "materials", label: "Matériaux", icon: Package },
  { id: "attendance", label: "Présences", icon: CalendarDays },
  { id: "salary", label: "Salaires", icon: DollarSign },
  { id: "reports", label: "Rapports", icon: FileBarChart },
]

// ─────────────────────── MATERIALS TAB ───────────────────────
function MaterialsTab({ projectId }: { projectId: string }) {
  const router = useRouter()
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const fetchMaterials = async () => {
    try {
      const res = await api.get(`/materials/projects/${projectId}/logs`)
      if (res.data.success) setMaterials(res.data.data)
    } catch {
      toast.error("Impossible de charger les matériaux")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMaterials() }, [projectId])

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{materials.length} activité{materials.length > 1 ? "s" : ""}</span>
        <div className="flex items-center gap-2">
          {/* Arrivage / Entry */}
          <StockMovementDialog
            projectId={projectId}
            type="IN"
            onSuccess={fetchMaterials}
            locale="fr"
          />
          {/* Sortie / Exit */}
          <StockMovementDialog
            projectId={projectId}
            type="OUT"
            onSuccess={fetchMaterials}
            locale="fr"
          />
        </div>
      </div>

      {/* Logs Grid exactly like Manager view */}
      <div className="grid gap-3 mt-4">
        {materials.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground text-sm border border-dashed rounded-2xl">
            Aucun mouvement enregistré pour ce projet
          </div>
        ) : (
          materials.map((log: any) => (
            <div
              key={log._id}
              onClick={() => log.materialId?._id && router.push(`/accountant/materials/${log.materialId._id}`)}
              className="rounded-2xl border border-border bg-card p-4 shadow-sm flex items-center justify-between hover:border-amber-500/30 hover:bg-muted/30 transition-all cursor-pointer group"
            >
              <div className="space-y-1">
                <div className="font-bold text-base group-hover:text-amber-500 transition-colors flex items-center gap-2">
                  {log.materialId?.name || log.name || 'Matériel'}
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{new Date(log.createdAt || log.date).toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  {log.supplier && <span>• {log.supplier}</span>}
                </div>
              </div>
              <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold shadow-sm",
                log.type === 'IN' ? "bg-green-500/10 text-green-600 border border-green-500/20" : "bg-red-500/10 text-red-600 border border-red-500/20"
              )}>
                {log.type === 'IN' ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                {log.quantity} {log.materialId?.unit || log.unit || 'T'}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// ─────────────────────── ATTENDANCE TAB ───────────────────────
function AttendanceTab({ projectId }: { projectId: string }) {
  const [week, setWeek] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const firstDayOfYear = new Date(year, 0, 1)
    const startOfFirstWeek = new Date(firstDayOfYear)
    startOfFirstWeek.setDate(firstDayOfYear.getDate() - firstDayOfYear.getDay())
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - now.getDay())
    const weekNum = Math.floor((startOfThisWeek.getTime() - startOfFirstWeek.getTime()) / (86400000 * 7)) + 1
    return `${year}-W${String(weekNum).padStart(2, "0")}`
  })
  const [attendance, setAttendance] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchAttendance = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/attendance/${projectId}/${week}`)
        if (res.data.success) setAttendance(res.data.data)
      } catch {
        toast.error("Impossible de charger les présences")
      } finally {
        setLoading(false)
      }
    }
    fetchAttendance()
  }, [projectId, week])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semaine</label>
        <input
          type="week"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Travailleur", "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Total"].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    Aucune présence enregistrée pour cette semaine
                  </td>
                </tr>
              ) : (
                attendance.map((record: any) => (
                  <tr key={record.workerId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-3 py-3 font-medium">{record.workerName}</td>
                    {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(day => {
                      const val = record[day] ?? 0
                      return (
                        <td key={day} className="px-3 py-3 text-center">
                          {val > 0 ? (
                            <span className={`inline-flex items-center justify-center min-w-[2rem] px-1.5 py-0.5 rounded-md text-xs font-bold ${
                              val === 1 ? 'bg-green-500/10 text-green-500' :
                              val >= 2 ? 'bg-blue-500/10 text-blue-400' :
                              'bg-amber-500/10 text-amber-500'
                            }`}>
                              {val}j
                            </span>
                          ) : (
                            <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                          )}
                        </td>
                      )
                    })}
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5 font-semibold">
                        {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
                          .reduce((sum, d) => sum + (record[d] ?? 0), 0)}j
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─────────────────────── SALARY TAB ───────────────────────
function SalaryTab({ projectId }: { projectId: string }) {
  const [week, setWeek] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const firstDayOfYear = new Date(year, 0, 1)
    const startOfFirstWeek = new Date(firstDayOfYear)
    startOfFirstWeek.setDate(firstDayOfYear.getDate() - firstDayOfYear.getDay())
    const startOfThisWeek = new Date(now)
    startOfThisWeek.setDate(now.getDate() - now.getDay())
    const weekNum = Math.floor((startOfThisWeek.getTime() - startOfFirstWeek.getTime()) / (86400000 * 7)) + 1
    return `${year}-W${String(weekNum).padStart(2, "0")}`
  })
  const [salary, setSalary] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSalary = async () => {
      setLoading(true)
      try {
        const res = await api.get(`/salary/${projectId}/${week}`)
        if (res.data.success) setSalary(res.data.data)
      } catch {
        toast.error("Impossible de charger les salaires")
      } finally {
        setLoading(false)
      }
    }
    fetchSalary()
  }, [projectId, week])

  const total = salary?.workers?.reduce((sum: number, w: any) => sum + (w.totalSalary || 0), 0) || 0

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Semaine</label>
        <input
          type="week"
          value={week}
          onChange={(e) => setWeek(e.target.value)}
          className="rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
        />
        {total > 0 && (
          <div className="ml-auto rounded-xl bg-amber-500/10 border border-amber-500/20 px-4 py-2">
            <span className="text-xs text-muted-foreground">Total semaine : </span>
            <span className="font-bold text-amber-600">{total.toLocaleString()} DA</span>
          </div>
        )}
      </div>
      {loading ? <LoadingSpinner /> : (
        <div className="rounded-2xl border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                {["Travailleur", "Jours travaillés", "Salaire/Jour", "Total", "Statut"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {!salary?.workers?.length ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                    Aucun salaire pour cette semaine
                  </td>
                </tr>
              ) : (
                salary.workers.map((w: any) => (
                  <tr key={w.workerId} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{w.workerName}</td>
                    <td className="px-4 py-3 text-muted-foreground">{w.daysWorked}j</td>
                    <td className="px-4 py-3 text-muted-foreground">{w.dailyRate?.toLocaleString() || "—"} DA</td>
                    <td className="px-4 py-3 font-semibold text-amber-600">{w.totalSalary?.toLocaleString() || "—"} DA</td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={w.approved
                          ? "bg-green-500/10 text-green-600 border-green-500/30"
                          : "bg-orange-500/10 text-orange-600 border-orange-500/30"
                        }
                      >
                        {w.approved ? "Approuvé" : "En attente"}
                      </Badge>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─────────────────────── REPORTS TAB ───────────────────────
function ReportsTab({ projectId, projectName }: { projectId: string; projectName: string }) {
  const [generating, setGenerating] = useState<string | null>(null)
  const [reports, setReports] = useState<any[]>([])
  const [startDate, setStartDate] = useState(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await api.get(`/reports?projectId=${projectId}`)
        if (res.data.success) setReports(res.data.data)
      } catch {}
    }
    fetchReports()
  }, [projectId])

  const generateReport = async (type: string, label: string, formatType: "excel" | "pdf" = "excel") => {
    setGenerating(`${type}-${formatType}`)
    const apiType = type === "materials" ? "material" : type
    try {
      const res = await api.post("/reports/generate", {
        projectId,
        type: apiType,
        startDate,
        endDate,
        format: formatType
      })
      if (res.data.success) {
        toast.success(`Rapport ${label} ${formatType === 'excel' ? 'Excel' : 'PDF'} généré`)
        window.open(`${BACKEND_URL}${res.data.data.pdfUrl}`, '_blank')
        
        // Refresh past reports list
        const reportsRes = await api.get(`/reports?projectId=${projectId}`)
        if (reportsRes.data.success) setReports(reportsRes.data.data)
      }
    } catch (err: any) {
      console.error(err)
      toast.error(err.response?.data?.message || "Erreur lors de la génération du rapport")
    } finally {
      setGenerating(null)
    }
  }

  const reportTypes = [
    { type: "materials", label: "Matériaux", icon: Package, desc: "Liste complète des matériaux, stocks et mouvements" },
    { type: "salary", label: "Salaires", icon: DollarSign, desc: "Récapitulatif des salaires par travailleur" },
    { type: "attendance", label: "Présences", icon: CalendarDays, desc: "Tableau de présence des travailleurs" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl border border-amber-500/10">
        <div>
          <h3 className="font-bold text-lg tracking-tight">Générer un Rapport</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Période personnalisée</p>
        </div>
        <div className="flex flex-wrap items-center gap-4 bg-background/50 p-2.5 rounded-xl border border-border">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Du</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1 text-sm font-medium focus:outline-none text-foreground"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-semibold uppercase">Au</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-background border border-border rounded-lg px-2 py-1 text-sm font-medium focus:outline-none text-foreground"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reportTypes.map(({ type, label, icon: Icon, desc }) => (
          <div
            key={type}
            className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between gap-4 hover:border-amber-500/30 transition-all"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 mt-auto">
              {type === "materials" ? (
                <Button
                  className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2 font-medium"
                  size="sm"
                  disabled={generating === `${type}-excel`}
                  onClick={() => generateReport(type, label, "excel")}
                >
                  {generating === `${type}-excel` ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="h-4 w-4" />
                  )}
                  Télécharger Excel
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-1.5 font-medium text-xs"
                    size="sm"
                    disabled={generating === `${type}-excel`}
                    onClick={() => generateReport(type, label, "excel")}
                  >
                    {generating === `${type}-excel` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileSpreadsheet className="h-3.5 w-3.5" />
                    )}
                    Excel
                  </Button>
                  <Button
                    className="flex-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 rounded-xl gap-1.5 font-medium text-xs"
                    size="sm" variant="outline"
                    disabled={generating === `${type}-pdf`}
                    onClick={() => generateReport(type, label, "pdf")}
                  >
                    {generating === `${type}-pdf` ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileDown className="h-3.5 w-3.5" />
                    )}
                    PDF
                  </Button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Past Reports */}
      {reports.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Rapports existants</h3>
          <div className="rounded-2xl border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  {["Type", "Date", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {reports.map((r) => (
                  <tr key={r._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium capitalize">{r.type}</td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("fr-FR")}</td>
                    <td className="px-4 py-3">
                      <a href={`${BACKEND_URL}${r.pdfUrl}`} target="_blank" rel="noopener noreferrer">
                        <Button variant="ghost" size="sm" className="gap-2 hover:text-amber-500">
                          <FileDown className="h-3.5 w-3.5" />
                          Télécharger
                        </Button>
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ─────────────────────── SHARED ───────────────────────
function LoadingSpinner() {
  return (
    <div className="flex justify-center py-12">
      <Loader2 className="h-6 w-6 animate-spin text-amber-500" />
    </div>
  )
}

// ─────────────────────── MAIN PAGE ───────────────────────
export default function AccountantProjectDetail() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>("materials")

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/projects/${id}`)
        if (res.data.success) setProject(res.data.data)
      } catch {
        toast.error("Projet introuvable")
        router.push("/accountant")
      } finally {
        setLoading(false)
      }
    }
    if (id) fetchProject()
  }, [id])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center min-h-[400px]">
        <LoadingSpinner />
      </div>
    )
  }

  if (!project) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl hover:bg-muted shrink-0"
          onClick={() => router.push("/accountant")}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-[10px] uppercase tracking-wider border-amber-500/30 text-amber-600 bg-amber-500/5">
              {project.status || "Actif"}
            </Badge>
          </div>
          <h1 className="text-2xl font-bold truncate">{project.name}</h1>
          {project.location && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
              <MapPin className="h-3.5 w-3.5 text-amber-500/70" />
              <span>{project.location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-2xl bg-muted/50 border border-border p-1">
        {TABS.map(({ id: tabId, label, icon: Icon }) => (
          <button
            key={tabId}
            onClick={() => setActiveTab(tabId)}
            className={cn(
              "flex items-center gap-2 flex-1 justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200",
              activeTab === tabId
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/20"
                : "text-muted-foreground hover:text-foreground hover:bg-background/60"
            )}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-in fade-in duration-200">
        {activeTab === "materials" && <MaterialsTab projectId={id as string} />}
        {activeTab === "attendance" && <AttendanceTab projectId={id as string} />}
        {activeTab === "salary" && <SalaryTab projectId={id as string} />}
        {activeTab === "reports" && <ReportsTab projectId={id as string} projectName={project.name} />}
      </div>
    </div>
  )
}
