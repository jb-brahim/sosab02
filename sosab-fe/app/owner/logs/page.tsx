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
                {log.changes && Object.keys(log.changes).length > 0 && (
                  <div className="p-2 rounded-xl bg-muted/40 border border-border/30 text-[10px] font-mono text-muted-foreground/90 max-h-24 overflow-y-auto">
                    <div className="font-bold text-foreground/80 mb-0.5 uppercase tracking-wide text-[9px]">Détails des modifications:</div>
                    {JSON.stringify(log.changes, null, 2)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
