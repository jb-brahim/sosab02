"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { toast } from "sonner"
import {
  Activity,
  Search,
  Filter,
  User,
  Calendar,
  Layers,
  Laptop,
  Globe,
  Trash2,
  PlusCircle,
  FileEdit,
  LogIn,
  LogOut,
  CheckCircle,
  XCircle
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format } from "date-fns"

const renderChanges = (changes: any, resource: string) => {
  if (!changes) return null
  const body = changes.body || {}
  if (Object.keys(body).length === 0) return null

  // Custom formats for specific resources
  if (resource === "Attendance") {
    const isPresent = body.present === true || body.present === "true"
    return (
      <div className="space-y-1 mt-1 bg-muted/30 p-2.5 rounded-xl border border-border/20">
        <div className="font-bold text-foreground/80 text-[10px] uppercase tracking-wider">Détails de Présence:</div>
        <div className="text-xs text-muted-foreground flex flex-wrap gap-x-4">
          <span>Statut: <strong className={isPresent ? "text-green-500 font-bold" : "text-red-500 font-bold"}>{isPresent ? "Présent" : "Absent"}</strong></span>
          {isPresent && <span>Valeur: <strong>{body.dayValue || 1}</strong></span>}
          {body.date && <span>Date: <strong>{body.date}</strong></span>}
        </div>
      </div>
    )
  }

  if (resource === "DailyReport") {
    return (
      <div className="space-y-1.5 mt-1 bg-muted/30 p-2.5 rounded-xl border border-border/20">
        <div className="font-bold text-foreground/80 text-[10px] uppercase tracking-wider">Rapport Journalier:</div>
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
    if (key.endsWith("Id") || key === "_id" || typeof val === "object") return
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

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [actionFilter, setActionFilter] = useState("ALL")
  const [resourceFilter, setResourceFilter] = useState("ALL")

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        setLoading(true)
        const res = await api.get("/admin/logs")
        if (res.data.success) {
          setLogs(res.data.data)
        }
      } catch (error) {
        console.error("Failed to load audit logs", error)
        toast.error("Impossible de charger le journal d'activité")
      } finally {
        setLoading(false)
      }
    }
    fetchLogs()
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

    const matchesAction = actionFilter === "ALL" || log.action === actionFilter
    const matchesResource = resourceFilter === "ALL" || log.resource === resourceFilter

    return matchesSearch && matchesAction && matchesResource
  })

  // Get list of unique resources for the filter select dropdown
  const uniqueResources = Array.from(new Set(logs.map(l => l.resource).filter(Boolean)))

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Activity className="h-6 w-6 text-purple-500" />
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
        
        <div>
          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="h-10 text-xs rounded-xl bg-card">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="ALL">Toutes les actions</SelectItem>
              <SelectItem value="create">Création</SelectItem>
              <SelectItem value="update">Modification</SelectItem>
              <SelectItem value="delete">Suppression</SelectItem>
              <SelectItem value="login">Connexions</SelectItem>
              <SelectItem value="logout">Déconnexions</SelectItem>
              <SelectItem value="approve">Approbation</SelectItem>
              <SelectItem value="reject">Rejet</SelectItem>
            </SelectContent>
          </Select>
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
          filteredLogs.map((log) => (
            <Card key={log._id} className="border-border/40 hover:border-purple-500/20 transition-all rounded-2xl overflow-hidden shadow-sm hover:bg-muted/5">
              <CardContent className="p-4 space-y-3">
                {/* Top Row: User & Action */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-bold text-xs">
                      {log.userId?.name?.charAt(0) || "S"}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-foreground/90">
                        {log.userId?.name || "Système Automatique"}
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
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/60" />
                    {format(new Date(log.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                  </span>
                  
                  {log.ipAddress && (
                    <span className="flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-muted-foreground/60" />
                      IP: {log.ipAddress}
                    </span>
                  )}

                  {log.userAgent && (
                    <span className="flex items-center gap-1.5 max-w-[250px] truncate">
                      <Laptop className="w-3.5 h-3.5 text-muted-foreground/60" />
                      {log.userAgent}
                    </span>
                  )}
                </div>

                {/* Optional changes debug print */}
                {renderChanges(log.changes, log.resource)}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
