"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { toast } from "sonner"
import {
  Megaphone,
  PlusCircle,
  Trash2,
  Users,
  User,
  Clock,
  Eye,
  CheckCircle,
  XCircle,
  HelpCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} j`
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
  } catch {
    return ""
  }
}

export default function OwnerNewsPage() {
  const [announcements, setAnnouncements] = useState<any[]>([])
  const [managers, setManagers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [targetType, setTargetType] = useState<"all" | "specific">("all")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])

  const loadData = async () => {
    try {
      setLoading(true)
      const [annRes, managersRes] = await Promise.all([
        api.get("/announcements"),
        api.get("/users")
      ])

      if (annRes.data.success) {
        setAnnouncements(annRes.data.data)
      }

      if (managersRes.data.success) {
        // Exclude Admin from targets
        setManagers(managersRes.data.data.filter((u: any) => u.role !== "Admin"))
      }
    } catch (err) {
      console.error("Failed to load news page data:", err)
      toast.error("Impossible de charger les données.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleToggleUser = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId))
    } else {
      setSelectedUsers([...selectedUsers, userId])
    }
  }

  const handleSelectAllUsers = () => {
    if (selectedUsers.length === managers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(managers.map(m => m._id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !content.trim()) {
      toast.error("Veuillez remplir le titre et le contenu.")
      return
    }

    if (targetType === "specific" && selectedUsers.length === 0) {
      toast.error("Veuillez sélectionner au moins un destinataire.")
      return
    }

    try {
      setSubmitting(true)
      const res = await api.post("/announcements", {
        title,
        content,
        targetType,
        targetUsers: targetType === "specific" ? selectedUsers : []
      })

      if (res.data.success) {
        toast.success("Annonce publiée avec succès !")
        setTitle("")
        setContent("")
        setTargetType("all")
        setSelectedUsers([])
        loadData()
      }
    } catch (err: any) {
      console.error("Failed to create announcement:", err)
      toast.error(err.response?.data?.message || "Échec de la publication.")
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Voulez-vous vraiment supprimer cette annonce ? Elle disparaîtra pour tous les utilisateurs.")) {
      return
    }

    try {
      const res = await api.delete(`/announcements/${id}`)
      if (res.data.success) {
        toast.success("Annonce supprimée.")
        loadData()
      }
    } catch (err) {
      console.error("Failed to delete announcement:", err)
      toast.error("Impossible de supprimer l'annonce.")
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black tracking-tight text-foreground flex items-center gap-2">
          <Megaphone className="h-6 w-6 text-primary" />
          Centre d'Annonces & Actualités
        </h1>
        <p className="text-muted-foreground text-xs mt-0.5">
          Publiez des messages importants qui apparaîtront sous forme de popup sur les écrans de vos collaborateurs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-24">
        {/* Creation Form */}
        <div className="lg:col-span-5">
          <Card className="border-border/40 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-primary" />
                Nouvelle Annonce
              </CardTitle>
              <CardDescription className="text-[11px]">
                Rédigez le message et ciblez vos collaborateurs.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Title */}
                <div className="space-y-1.5">
                  <Label htmlFor="title" className="text-xs font-bold text-foreground/80">Titre de l'Annonce</Label>
                  <Input
                    id="title"
                    placeholder="Ex: Maintenance du système, Rappels de sécurité..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                {/* Content */}
                <div className="space-y-1.5">
                  <Label htmlFor="content" className="text-xs font-bold text-foreground/80">Message</Label>
                  <textarea
                    id="content"
                    rows={5}
                    placeholder="Écrivez le contenu de votre annonce ici..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="w-full text-xs rounded-xl border border-input bg-transparent px-3 py-2 shadow-sm placeholder:text-muted-foreground/60 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  />
                </div>

                {/* Target type */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-foreground/80 block">Destinataires</Label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={targetType === "all" ? "default" : "outline"}
                      onClick={() => setTargetType("all")}
                      className="flex-1 text-xs rounded-xl font-bold h-9"
                    >
                      <Users className="w-3.5 h-3.5 mr-1.5" />
                      Tout le monde
                    </Button>
                    <Button
                      type="button"
                      variant={targetType === "specific" ? "default" : "outline"}
                      onClick={() => setTargetType("specific")}
                      className="flex-1 text-xs rounded-xl font-bold h-9"
                    >
                      <User className="w-3.5 h-3.5 mr-1.5" />
                      Ciblé
                    </Button>
                  </div>
                </div>

                {/* Specific managers checklist */}
                {targetType === "specific" && (
                  <div className="space-y-2 bg-muted/20 border border-border/30 p-3 rounded-xl max-h-[180px] overflow-y-auto">
                    <div className="flex items-center justify-between border-b border-border/30 pb-1.5 mb-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Collaborateurs ({selectedUsers.length})</span>
                      <button
                        type="button"
                        onClick={handleSelectAllUsers}
                        className="text-[10px] text-primary hover:underline font-bold"
                      >
                        {selectedUsers.length === managers.length ? "Tout désélectionner" : "Tout sélectionner"}
                      </button>
                    </div>
                    {managers.length === 0 ? (
                      <p className="text-[10px] text-muted-foreground italic text-center py-2">Aucun utilisateur disponible</p>
                    ) : (
                      <div className="space-y-1.5">
                        {managers.map((m) => (
                          <label key={m._id} className="flex items-center gap-2 p-1.5 hover:bg-muted/30 rounded-lg cursor-pointer transition-all">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(m._id)}
                              onChange={() => handleToggleUser(m._id)}
                              className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5 cursor-pointer"
                            />
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-foreground/80 truncate">{m.name}</span>
                              <span className="text-[9px] text-muted-foreground truncate">{m.role} • {m.email}</span>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Submit button */}
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-10 gap-2 text-xs"
                >
                  <Megaphone className="w-4 h-4" />
                  {submitting ? "Publication en cours..." : "Publier l'Annonce"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Announcements History */}
        <div className="lg:col-span-7">
          <Card className="border-border/40 shadow-sm rounded-2xl bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                Historique des Annonces
              </CardTitle>
              <CardDescription className="text-[11px]">
                Suivez la diffusion et les lectures de vos annonces.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="py-20 text-center animate-pulse text-muted-foreground text-xs font-medium">
                  Chargement de l'historique...
                </div>
              ) : announcements.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground border border-dashed border-border rounded-2xl bg-card/20 text-xs">
                  Aucune annonce publiée pour le moment.
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((ann) => {
                    const totalTargets = ann.targetType === "all" ? managers.length : ann.targetUsers?.length || 0
                    const readCount = ann.readBy?.length || 0
                    const percentRead = totalTargets > 0 ? Math.round((readCount / totalTargets) * 100) : 0

                    return (
                      <div
                        key={ann._id}
                        className="border border-border/40 p-4 rounded-2xl bg-card hover:border-primary/20 transition-all space-y-3 relative group"
                      >
                        {/* Title & Delete */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-0.5">
                            <h3 className="font-extrabold text-sm text-foreground/90">{ann.title}</h3>
                            <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Publié {formatRelativeTime(ann.createdAt)}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ann._id)}
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 rounded-lg shrink-0"
                            title="Supprimer l'annonce"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Content */}
                        <p className="text-xs text-foreground/75 leading-relaxed bg-muted/20 p-2.5 rounded-xl border border-border/30 whitespace-pre-wrap">
                          {ann.content}
                        </p>

                        {/* Targeting & Read statistics */}
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground border-t border-border/20 pt-2.5">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold">Ciblage :</span>
                            {ann.targetType === "all" ? (
                              <Badge className="bg-primary/10 text-primary border-primary/20 hover:bg-primary/10 text-[9px] py-0 px-1.5">Tous</Badge>
                            ) : (
                              <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/10 text-[9px] py-0 px-1.5">
                                Cible ({totalTargets})
                              </Badge>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5" title={`Lus par: ${ann.readBy?.map((r: any) => r.name).join(', ') || 'aucun'}`}>
                            <Eye className="w-3.5 h-3.5 text-muted-foreground/75" />
                            <span className="font-bold">Lu par :</span>
                            <span className="text-foreground/80 font-extrabold">
                              {readCount} / {totalTargets}
                            </span>
                            <span className="bg-muted px-1.5 py-0.5 rounded text-[9px] font-bold">
                              {percentRead}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
