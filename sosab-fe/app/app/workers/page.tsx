"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Search, UserPlus, CheckCircle, Clock, XCircle, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

const statusConfig: any = {
  present: { icon: CheckCircle, color: "text-success", bg: "bg-success/20", label: "Present" },
  late: { icon: Clock, color: "text-primary", bg: "bg-primary/20", label: "Late" },
  absent: { icon: XCircle, color: "text-destructive", bg: "bg-destructive/20", label: "Absent" },
  // Default fallback
  unknown: { icon: UserPlus, color: "text-muted-foreground", bg: "bg-muted", label: "Unknown" }
}

export default function WorkersPage() {
  const [workers, setWorkers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const fetchWorkers = async () => {
      try {
        const res = await api.get('/workers')
        // Handle different response structures (pagination often wraps in 'data')
        const fetchedWorkers = res.data.data ? res.data.data : (Array.isArray(res.data) ? res.data : [])
        setWorkers(fetchedWorkers)
      } catch (error) {
        console.error("Failed to fetch workers", error)
        toast.error("Failed to load worker list")
      } finally {
        setLoading(false)
      }
    }
    fetchWorkers()
  }, [])

  // Filter based on search
  const filteredWorkers = workers.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()))

  // Calculate live stats
  // Note: Assuming 'status' field exists on worker, defaulting to 'present' if active
  const stats = {
    present: workers.filter((w) => w.status === "present" || (w.active && !w.status)).length,
    late: workers.filter((w) => w.status === "late").length,
    absent: workers.filter((w) => w.status === "absent" || (!w.active)).length,
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-4 pb-24">
      <div className="flex items-center justify-between pt-2">
        <h1 className="font-display text-2xl font-bold">Workers</h1>
        <Button size="sm" className="bg-primary text-primary-foreground">
          <UserPlus className="mr-2 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="border-success/30 bg-success/5">
          <CardContent className="p-3 text-center">
            <p className="font-display text-xl font-bold text-success">{stats.present}</p>
            <p className="text-xs text-muted-foreground">Present</p>
          </CardContent>
        </Card>
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="p-3 text-center">
            <p className="font-display text-xl font-bold text-primary">{stats.late}</p>
            <p className="text-xs text-muted-foreground">Late</p>
          </CardContent>
        </Card>
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-3 text-center">
            <p className="font-display text-xl font-bold text-destructive">{stats.absent}</p>
            <p className="text-xs text-muted-foreground">Absent</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search workers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-input pl-9"
        />
      </div>

      {/* Worker List */}
      <div className="space-y-3">
        {filteredWorkers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No workers found.</div>
        ) : (
          filteredWorkers.map((worker) => {
            // Determine status (mock logic if field missing)
            const statusKey = worker.status || (worker.active ? 'present' : 'absent')
            const status = statusConfig[statusKey] || statusConfig.unknown
            const StatusIcon = status.icon

            return (
              <Card key={worker._id} className="border-border bg-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${worker.name}`} />
                    <AvatarFallback className="bg-muted text-foreground">
                      {worker.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{worker.name}</p>
                    <p className="text-sm text-muted-foreground">{worker.trade || worker.role || 'Worker'}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className={`${status.bg} ${status.color} border-transparent`}>
                      <StatusIcon className="mr-1 h-3 w-3" />
                      {status.label}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
    </div>
  )
}
