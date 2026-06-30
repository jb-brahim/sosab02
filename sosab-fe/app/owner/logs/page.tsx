"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { toast } from "sonner"
import {
  Activity,
  Search,
  Filter,
  User,
  Calendar as CalendarIcon,
  Layers,
  Laptop,
  Globe,
  Trash2,
  PlusCircle,
  FileEdit,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle,
  X,
  MapPin
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"

const groupLogs = (logsList: any[]) => {
  const grouped: any[] = []
  
  logsList.forEach(log => {
    if (log.resource !== "Attendance" || !log.changes?.body) {
      grouped.push(log)
      return
    }
    
    const body = log.changes.body
    const projectId = body.projectId
    const userId = log.userId?._id || log.userId
    const action = log.action
    const date = body.date
    const time = new Date(log.createdAt).getTime()
    
    // Find an existing group in `grouped`
    // Group if they are close in time (within 15s) and have same project, user, action, and attendance date
    const existingGroupIndex = grouped.findIndex(g => 
      g.resource === "Attendance" &&
      (g.userId?._id || g.userId) === userId &&
      g.action === action &&
      g.changes?.body?.projectId === projectId &&
      g.changes?.body?.date === date &&
      Math.abs(new Date(g.createdAt).getTime() - time) < 15000
    )
    
    if (existingGroupIndex > -1) {
      // Add to existing group
      if (!grouped[existingGroupIndex].isGrouped) {
        const originalLog = grouped[existingGroupIndex]
        grouped[existingGroupIndex] = {
          ...originalLog,
          isGrouped: true,
          logs: [originalLog, log]
        }
      } else {
        grouped[existingGroupIndex].logs.push(log)
      }
    } else {
      grouped.push(log)
    }
  })
  
  return grouped
}

const renderChanges = (log: any, workers: any[], projects: any[]) => {
  if (!log) return null

  if (log.isGrouped && log.resource === "Attendance") {
    const firstBody = log.logs[0].changes?.body || {}
    const projectName = projects.find((p: any) => p._id === firstBody.projectId || p.id === firstBody.projectId)?.name || `ID: ${firstBody.projectId?.substring(0, 8)}...`
    const date = firstBody.date

    return (
      <div className="space-y-2.5 mt-1 bg-primary/5 p-3 rounded-xl border border-primary/10">
        <div className="font-bold text-primary text-[10px] uppercase tracking-wider flex items-center gap-1 justify-between">
          <span className="flex items-center gap-1">
            <Activity className="w-3.5 h-3.5" /> Présences Groupées ({log.logs.length} ouvriers)
          </span>
          {date && <span className="text-muted-foreground font-semibold normal-case">Date: {date}</span>}
        </div>
        <div className="text-xs text-muted-foreground">
          Chantier: <strong className="text-foreground font-extrabold">{projectName}</strong>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-border/10">
          {log.logs.map((item: any, index: number) => {
            const itemBody = item.changes?.body || {}
            const isPresent = itemBody.present === true || itemBody.present === "true" || itemBody.present === 1
            const wId = itemBody.workerId
            const workerName = wId 
              ? (workers.find((w: any) => w._id === wId || w.id === wId)?.name || `ID: ${wId.substring(0, 8)}...`)
              : null
            return (
              <div key={index} className="flex items-center justify-between p-2 bg-background/50 rounded-xl border border-border/30">
                {workerName && <span className="font-semibold text-foreground/95 text-xs">{workerName}</span>}
                <div className="flex items-center gap-2">
                  <span className={isPresent ? "text-green-500 font-bold text-xs" : "text-red-500 font-bold text-xs"}>
                    {isPresent ? "Présent" : "Absent"}
                  </span>
                  {isPresent && itemBody.dayValue !== undefined && (
                    <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded-md text-muted-foreground font-bold">
                      {itemBody.dayValue} j
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  const changes = log.changes
  const resource = log.resource
  if (!changes) return null
  const body = changes.body || {}
  if (Object.keys(body).length === 0) return null

  // Skip rendering change tables for simple status toggles or password resets
  if (resource === "User" && log.action === "update") {
    if (body.active !== undefined || body.password !== undefined) {
      return null
    }
  }

  // Custom formats for specific resources
  if (resource === "Attendance") {
    const isPresent = body.present === true || body.present === "true" || body.present === 1
    const wId = body.workerId
    const pId = body.projectId
    const workerName = wId 
      ? (workers.find((w: any) => w._id === wId || w.id === wId)?.name || `ID: ${wId.substring(0, 8)}...`)
      : null
    const projectName = pId 
      ? (projects.find((p: any) => p._id === pId || p.id === pId)?.name || `ID: ${pId.substring(0, 8)}...`)
      : null
    
    return (
      <div className="space-y-2 mt-1 bg-primary/5 p-3 rounded-xl border border-primary/10">
        <div className="font-bold text-primary text-[10px] uppercase tracking-wider flex items-center gap-1">
          <Activity className="w-3.5 h-3.5" /> Détails de Présence
        </div>
        <div className="text-xs text-muted-foreground grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
          {workerName && <span>Ouvrier: <strong className="text-foreground font-extrabold">{workerName}</strong></span>}
          {projectName && <span>Chantier: <strong className="text-foreground font-extrabold">{projectName}</strong></span>}
          <span>Statut: <strong className={isPresent ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{isPresent ? "Présent" : "Absent"}</strong></span>
          {isPresent && <span>Valeur journée: <strong>{body.dayValue !== undefined ? body.dayValue : 1}</strong></span>}
          {body.overtime > 0 && <span>Heures supplémentaires: <strong className="text-amber-500">{body.overtime}h</strong></span>}
          {body.bonus > 0 && <span>Bonus: <strong className="text-green-500">+{body.bonus} TND</strong></span>}
          {body.penalty > 0 && <span>Pénalité: <strong className="text-red-500">-{body.penalty} TND</strong></span>}
          {body.date && <span>Date de présence: <strong>{body.date}</strong></span>}
        </div>
        {body.notes && (
          <div className="text-xs text-muted-foreground border-t border-border/20 pt-1.5 mt-1">
            <span className="font-semibold block text-foreground/75">Notes de présence:</span>
            <p className="mt-0.5 text-xs italic bg-muted/40 p-2 rounded">{body.notes}</p>
          </div>
        )}
      </div>
    )
  }

  if (resource === "DailyReport") {
    const pId = body.projectId
    const projectName = pId 
      ? (projects.find((p: any) => p._id === pId || p.id === pId)?.name || `ID: ${pId.substring(0, 8)}...`)
      : null
    return (
      <div className="space-y-1.5 mt-1 bg-muted/30 p-2.5 rounded-xl border border-border/20">
        <div className="font-bold text-foreground/80 text-[10px] uppercase tracking-wider">Rapport Journalier:</div>
        {projectName && (
          <div className="text-xs text-muted-foreground mb-1">
            Chantier: <strong className="text-foreground font-extrabold">{projectName}</strong>
          </div>
        )}
        {body.workCompleted && (
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground/75 block">Travaux réalisés:</span>
            <p className="whitespace-pre-line mt-0.5 bg-background/50 p-2 rounded border border-border/30 text-xs italic leading-relaxed text-foreground/90">{body.workCompleted}</p>
          </div>
        )}
        {body.issues && (
          <div className="text-xs text-red-500">
            <span className="font-semibold block">Problèmes signalés:</span>
            <p className="mt-0.5 bg-red-500/5 p-2 rounded border border-red-500/10 text-xs italic leading-relaxed text-red-500">{body.issues}</p>
          </div>
        )}
      </div>
    )
  }

  // General bullet points for other resources
  const lines: { label: string; value: string }[] = []
  
  const formatKey = (key: string) => {
    const labels: Record<string, string> = {
      name: "Nom",
      email: "Email",
      role: "Rôle",
      active: "Actif",
      location: "Emplacement",
      budget: "Budget",
      startDate: "Date de début",
      endDate: "Date de fin",
      progress: "Progression",
      status: "Statut",
      quantity: "Quantité",
      unit: "Unité",
      supplier: "Fournisseur",
      price: "Prix",
      type: "Type",
      notes: "Notes",
      description: "Description"
    }
    return labels[key] || key
  }

  const formatValue = (val: any) => {
    if (typeof val === "boolean") return val ? "Oui" : "Non"
    if (val === null || val === undefined) return "—"
    return val.toString()
  }

  Object.entries(body).forEach(([key, val]) => {
    if (key.endsWith("Id") || key === "_id" || typeof val === "object") {
      if (key === "projectId") {
        const projName = projects.find((p: any) => p._id === val || p.id === val)?.name
        if (projName) {
          lines.push({ label: "Chantier", value: projName })
        }
      } else if (key === "workerId") {
        const wrkName = workers.find((w: any) => w._id === val || w.id === val)?.name
        if (wrkName) {
          lines.push({ label: "Ouvrier", value: wrkName })
        }
      }
      return
    }
    lines.push({ label: formatKey(key), value: formatValue(val) })
  })

  if (lines.length === 0) return null

  return (
    <div className="space-y-1.5 mt-1 bg-muted/30 p-2.5 rounded-xl border border-border/20">
      <div className="font-bold text-foreground/80 text-[10px] uppercase tracking-wider">Informations:</div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1">
        {lines.map((line, idx) => (
          <div key={idx} className="text-xs flex items-center justify-between border-b border-border/10 pb-0.5">
            <span className="text-muted-foreground">{line.label}:</span>
            <span className="font-semibold text-foreground/90">{line.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const getTargetName = (log: any, users: any[], projects: any[], workers: any[]) => {
  if (!log.resourceId) return null
  
  const id = log.resourceId
  
  if (log.resource === "User") {
    const u = users.find(x => x._id === id || x.id === id)
    return u ? `${u.name} (${u.role})` : `ID: ${id.substring(0, 8)}...`
  }
  
  if (log.resource === "Project") {
    const p = projects.find(x => x._id === id || x.id === id)
    return p ? p.name : `ID: ${id.substring(0, 8)}...`
  }
  
  if (log.resource === "Worker") {
    const w = workers.find(x => x._id === id || x.id === id)
    return w ? w.name : `ID: ${id.substring(0, 8)}...`
  }
  
  return null
}

const parseUserAgent = (ua: string) => {
  if (!ua) return "Inconnu"
  
  let os = "Inconnu"
  let browser = "Navigateur"
  let device = ""

  // 1. Detect OS
  if (/windows nt 10\.0/i.test(ua)) os = "Windows 10/11"
  else if (/windows nt 6\.3/i.test(ua)) os = "Windows 8.1"
  else if (/windows nt 6\.2/i.test(ua)) os = "Windows 8"
  else if (/windows nt 6\.1/i.test(ua)) os = "Windows 7"
  else if (/macintosh|mac os x/i.test(ua)) os = "macOS"
  else if (/android/i.test(ua)) {
    const match = ua.match(/android\s+([0-9\.]+)/i)
    os = match ? `Android ${match[1]}` : "Android"
  } else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/os\s+([0-9_]+)\s+like\s+mac\s+os\s+x/i)
    os = match ? `iOS ${match[1].replace(/_/g, '.')}` : "iOS"
  } else if (/linux/i.test(ua)) os = "Linux"

  // 2. Detect Device Type / Model
  if (/iphone/i.test(ua)) device = "iPhone"
  else if (/ipad/i.test(ua)) device = "iPad"
  else if (/samsung|sm-/i.test(ua)) device = "Samsung"
  else if (/huawei|honor/i.test(ua)) device = "Huawei"
  else if (/redmi|xiaomi|mi\s/i.test(ua)) device = "Xiaomi"
  else if (/oppo/i.test(ua)) device = "Oppo"
  else if (/vivo/i.test(ua)) device = "Vivo"
  else if (/oneplus/i.test(ua)) device = "OnePlus"
  
  // 3. Detect Browser
  if (/edg/i.test(ua)) browser = "Edge"
  else if (/opr/i.test(ua)) browser = "Opera"
  else if (/chrome|crios/i.test(ua)) {
    browser = "Chrome"
  } else if (/safari/i.test(ua) && !/chrome|crios|android/i.test(ua)) {
    browser = "Safari"
  } else if (/firefox|fxios/i.test(ua)) {
    browser = "Firefox"
  }

  // Combine into a clean string
  const devicePart = device ? `${device} • ` : ""
  return `${devicePart}${browser} (${os})`
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [workers, setWorkers] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [resourceFilter, setResourceFilter] = useState("ALL")

  useEffect(() => {
    const loadAllData = async () => {
      try {
        setLoading(true)
        const [logsRes, workersRes, projectsRes, usersRes] = await Promise.all([
          api.get("/admin/logs"),
          api.get("/workers?includeInactive=true").catch(err => ({ data: { success: false, data: [] } })),
          api.get("/projects").catch(err => ({ data: { success: false, data: [] } })),
          api.get("/users").catch(err => ({ data: { success: false, data: [] } }))
        ])
        
        // Add logs page load diagnostics
        console.log("--- LOGS PAGE LOAD DIAGNOSTICS ---")
        console.log("Logs success:", logsRes.data.success, "Count:", logsRes.data.data?.length)
        console.log("Workers success:", workersRes.data.success, "Count:", workersRes.data.data?.length)
        console.log("Projects success:", projectsRes.data.success, "Count:", projectsRes.data.data?.length)
        console.log("Users success:", usersRes.data.success, "Count:", usersRes.data.data?.length)

        if (logsRes.data.success) {
          setLogs(logsRes.data.data)
        }
        if (workersRes.data.success) {
          setWorkers(workersRes.data.data)
        } else if (Array.isArray(workersRes.data)) {
          console.log("Workers API returned raw array:", workersRes.data.length)
          setWorkers(workersRes.data)
        }
        if (projectsRes.data.success) {
          setProjects(projectsRes.data.data)
        } else if (Array.isArray(projectsRes.data)) {
          console.log("Projects API returned raw array:", projectsRes.data.length)
          setProjects(projectsRes.data)
        }
        if (usersRes.data.success) {
          setUsers(usersRes.data.data)
        } else if (Array.isArray(usersRes.data)) {
          console.log("Users API returned raw array:", usersRes.data.length)
          setUsers(usersRes.data)
        }
      } catch (error) {
        console.error("Failed to load audit logs data", error)
        toast.error("Impossible de charger les logs ou les données")
      } finally {
        setLoading(false)
      }
    }
    loadAllData()
  }, [])

  // Action badge formatter
  const getActionBadge = (action: string) => {
    switch (action) {
      case "create":
        return (
          <Badge className="bg-green-500/10 hover:bg-green-500/10 text-green-500 border-green-500/20 text-[9px] uppercase font-bold flex items-center gap-1">
            <PlusCircle className="w-3.5 h-3.5" /> Création
          </Badge>
        )
      case "update":
        return (
          <Badge className="bg-blue-500/10 hover:bg-blue-500/10 text-blue-500 border-blue-500/20 text-[9px] uppercase font-bold flex items-center gap-1">
            <FileEdit className="w-3.5 h-3.5" /> Modification
          </Badge>
        )
      case "delete":
        return (
          <Badge className="bg-red-500/10 hover:bg-red-500/10 text-red-500 border-red-500/20 text-[9px] uppercase font-bold flex items-center gap-1">
            <Trash2 className="w-3.5 h-3.5" /> Suppression
          </Badge>
        )
      case "login":
        return (
          <Badge className="bg-amber-500/10 hover:bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] uppercase font-bold flex items-center gap-1">
            <LogIn className="w-3.5 h-3.5" /> Login
          </Badge>
        )
      case "logout":
        return (
          <Badge className="bg-gray-500/10 hover:bg-gray-500/10 text-gray-500 border-gray-500/20 text-[9px] uppercase font-bold flex items-center gap-1">
            <LogOut className="w-3.5 h-3.5" /> Logout
          </Badge>
        )
      case "approve":
        return (
          <Badge className="bg-teal-500/10 hover:bg-teal-500/10 text-teal-500 border-teal-500/20 text-[9px] uppercase font-bold flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5" /> Approbation
          </Badge>
        )
      case "reject":
        return (
          <Badge className="bg-rose-500/10 hover:bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] uppercase font-bold flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Rejet
          </Badge>
        )
      default:
        return (
          <Badge className="bg-muted text-muted-foreground text-[9px] uppercase font-bold">
            {action}
          </Badge>
        )
    }
  }

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const userName = log.userId?.name || "Système"
    const userEmail = log.userId?.email || ""
    const matchesSearch = userName.toLowerCase().includes(search.toLowerCase()) || 
                          userEmail.toLowerCase().includes(search.toLowerCase()) ||
                          (log.resource && log.resource.toLowerCase().includes(search.toLowerCase()))

    let matchesDate = true
    if (selectedDate) {
      const logDate = new Date(log.createdAt)
      matchesDate = logDate.getDate() === selectedDate.getDate() &&
                    logDate.getMonth() === selectedDate.getMonth() &&
                    logDate.getFullYear() === selectedDate.getFullYear()
    }

    const matchesResource = resourceFilter === "ALL" || log.resource === resourceFilter

    return matchesSearch && matchesDate && matchesResource
  })

  // Get list of unique resources for the filter select dropdown
  const uniqueResources = Array.from(new Set(logs.map(l => l.resource).filter(Boolean)))

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          Journal d'Activité Audit
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Suivi en temps réel de toutes les opérations, modifications et connexions effectuées dans l'application.
        </p>
      </div>

      {/* Filters Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-card/50 p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/60" />
          <Input
            placeholder="Rechercher utilisateur ou ressource..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-10 text-xs rounded-xl"
          />
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary pointer-events-none" />
            <input
              type="date"
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                if (e.target.value) {
                  setSelectedDate(new Date(e.target.value + 'T12:00:00'))
                } else {
                  setSelectedDate(undefined)
                }
              }}
              className="w-full h-10 pl-9 pr-3 text-xs rounded-xl bg-card border border-border/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 font-semibold cursor-pointer"
              style={{ colorScheme: 'dark' }}
            />
          </div>
          {selectedDate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelectedDate(undefined)}
              className="h-10 w-10 text-muted-foreground hover:text-red-500 rounded-xl flex-shrink-0"
              title="Effacer la date"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        <div>
          <Select value={resourceFilter} onValueChange={setResourceFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-card">
              <SelectValue placeholder="Ressource" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Toutes les ressources</SelectItem>
              {uniqueResources.map(res => (
                <SelectItem key={res} value={res}>{res}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Logs Feed List */}
      <div className="space-y-3 pb-24">
        {loading ? (
          <div className="py-20 text-center animate-pulse text-muted-foreground text-sm font-medium">
            Chargement du journal d'activité...
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-card/20">
            Aucun log d'activité trouvé.
          </div>
        ) : (
          groupLogs(filteredLogs).map((log) => {
            const targetName = getTargetName(log, users, projects, workers)
            
            // Custom action text and colors for specific User updates
            let actionText = log.action === "create" ? "a créé" : log.action === "delete" ? "a supprimé" : "a modifié"
            let actionColor = "text-muted-foreground font-normal"

            if (log.resource === "User" && log.action === "update" && log.changes?.body) {
              const body = log.changes.body
              if (body.active === true || body.active === "true") {
                actionText = "a activé le compte de"
                actionColor = "text-green-500 font-bold"
              } else if (body.active === false || body.active === "false") {
                actionText = "a bloqué/désactivé le compte de"
                actionColor = "text-red-500 font-bold"
              } else if (body.password) {
                actionText = "a réinitialisé le mot de passe de"
                actionColor = "text-amber-500 font-bold"
              }
            }

            return (
              <Card key={log._id} className="border-border/40 hover:border-primary/20 transition-all rounded-2xl overflow-hidden shadow-sm hover:bg-muted/5">
                <CardContent className="p-4 space-y-3">
                  {/* Top Row: User & Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {log.userId?.name?.charAt(0) || "S"}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-foreground/90 flex flex-wrap items-center gap-1.5">
                          <span>{log.userId?.name || "Système Automatique"}</span>
                          {targetName && (
                            <>
                              <span className={`${actionColor} text-xs`}>
                                {actionText}
                              </span>
                              <span className="text-primary font-extrabold text-xs">{targetName}</span>
                            </>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {log.userId?.role || "System"} • {log.userId?.email || "system@sosab.com"}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 ml-10 sm:ml-0">
                      {getActionBadge(log.action)}
                      <Badge variant="outline" className="text-[9px] uppercase font-semibold text-muted-foreground flex items-center gap-1 py-0.5">
                        <Layers className="w-3 h-3 text-purple-500" />
                        {log.resource}
                      </Badge>
                    </div>
                  </div>

                  {/* Middle details: Device information */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-muted-foreground border-t border-border/30 pt-2.5">
                    <span className="flex items-center gap-1 font-semibold">
                      <CalendarIcon className="w-3.5 h-3.5 text-muted-foreground/60" />
                      {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                    </span>
                    
                    {log.ipAddress && (
                      <span className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-muted-foreground/60" />
                        IP: {log.ipAddress}
                      </span>
                    )}

                    {log.location && (
                      <span className="text-primary font-semibold">
                        ({log.location})
                      </span>
                    )}

                    {log.latitude && log.longitude && (
                      <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${log.latitude},${log.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-[10px] text-blue-500 hover:text-blue-600 font-extrabold bg-blue-500/10 hover:bg-blue-500/20 px-1.5 py-0.5 rounded-md border border-blue-500/20 transition-all cursor-pointer"
                        title="Voir la localisation exacte sur Google Maps"
                      >
                        <MapPin className="w-3.5 h-3.5 text-blue-500" />
                        <span>GPS</span>
                      </a>
                    )}

                    {log.userAgent && (
                      <span 
                        className="flex items-center gap-1.5 max-w-[250px] truncate cursor-help"
                        title={log.userAgent}
                      >
                        <Laptop className="w-3.5 h-3.5 text-muted-foreground/60" />
                        {parseUserAgent(log.userAgent)}
                      </span>
                    )}
                  </div>

                  {/* Optional changes debug print */}
                  {renderChanges(log, workers, projects)}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
