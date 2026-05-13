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
  Check,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { CreateMaterialDialog } from "@/components/admin/create-material-dialog"
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
  const [materials, setMaterials] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: "", unit: "", price: "", stockQuantity: "", category: "Standard" })
  const [saving, setSaving] = useState(false)

  // Quick stock log state (IN/OUT)
  const [logModal, setLogModal] = useState<{
    isOpen: boolean
    type: "IN" | "OUT" | null
    material: any | null
    quantity: string
    notes: string
    deliveredBy: string
    supplier: string
    bonLivraison: string
  }>({
    isOpen: false,
    type: null,
    material: null,
    quantity: "",
    notes: "",
    deliveredBy: "",
    supplier: "",
    bonLivraison: ""
  })

  const fetchMaterials = async () => {
    try {
      const res = await api.get(`/materials/${projectId}`)
      if (res.data.success) setMaterials(res.data.data)
    } catch {
      toast.error("Impossible de charger les matériaux")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchMaterials() }, [projectId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      if (editingId) {
        await api.patch(`/materials/item/${editingId}`, { ...form, price: Number(form.price), stockQuantity: Number(form.stockQuantity) })
        toast.success("Matériau mis à jour")
      } else {
        await api.post("/materials", { ...form, projectId, price: Number(form.price), stockQuantity: Number(form.stockQuantity) })
        toast.success("Matériau ajouté")
      }
      setShowForm(false)
      setEditingId(null)
      setForm({ name: "", unit: "", price: "", stockQuantity: "", category: "Standard" })
      fetchMaterials()
    } catch {
      toast.error("Erreur lors de la sauvegarde")
    } finally {
      setSaving(false)
    }
  }

  const handleQuickLogSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!logModal.material || !logModal.type || !logModal.quantity) return

    setSaving(true)
    try {
      const res = await api.post("/materials/quick-log", {
        projectId,
        materialId: logModal.material._id,
        materialName: logModal.material.name,
        unit: logModal.material.unit,
        category: logModal.material.category,
        type: logModal.type,
        quantity: parseFloat(logModal.quantity),
        notes: logModal.notes,
        deliveredBy: logModal.type === "IN" ? logModal.deliveredBy : undefined,
        supplier: logModal.type === "IN" ? logModal.supplier : undefined,
        bonLivraison: logModal.type === "IN" ? logModal.bonLivraison : undefined
      })

      if (res.data.success) {
        toast.success(logModal.type === "IN" ? "Arrivage enregistré !" : "Sortie enregistrée !")
        setLogModal({ isOpen: false, type: null, material: null, quantity: "", notes: "", deliveredBy: "", supplier: "", bonLivraison: "" })
        fetchMaterials()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer ce matériau ?")) return
    try {
      await api.delete(`/materials/item/${id}`)
      toast.success("Matériau supprimé")
      fetchMaterials()
    } catch {
      toast.error("Erreur lors de la suppression")
    }
  }

  const handleEdit = (m: any) => {
    setEditingId(m._id)
    setForm({ name: m.name, unit: m.unit, price: String(m.price || ""), stockQuantity: String(m.stockQuantity || ""), category: m.category || "Standard" })
    setShowForm(true)
  }

  if (loading) return <LoadingSpinner />

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{materials.length} matériau{materials.length > 1 ? "x" : ""}</span>
        <CreateMaterialDialog
          projectId={projectId}
          onMaterialCreated={fetchMaterials}
          locale="fr"
          triggerLabel="Ajouter"
          triggerClassName="bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2 h-9 px-4 text-xs font-semibold"
        />
      </div>

      {/* Form (only for editing) */}
      {showForm && editingId && (
        <form onSubmit={handleSubmit} className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <h3 className="font-semibold text-sm">Modifier le matériau</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: "name", label: "Nom", placeholder: "Ex: Ciment" },
              { key: "unit", label: "Unité", placeholder: "Ex: sac, m³, kg" },
              { key: "price", label: "Prix (DA)", placeholder: "0", type: "number" },
              { key: "stockQuantity", label: "Quantité initiale", placeholder: "0", type: "number" },
            ].map(({ key, label, placeholder, type }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</label>
                <input
                  type={type || "text"}
                  placeholder={placeholder}
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  required={key === "name" || key === "unit"}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingId(null) }}>
              Annuler
            </Button>
            <Button type="submit" size="sm" className="bg-amber-500 hover:bg-amber-600 text-white" disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Mettre à jour"}
            </Button>
          </div>
        </form>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {["Nom", "Unité", "Prix", "Stock", "Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {materials.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground text-sm">
                  Aucun matériau enregistré
                </td>
              </tr>
            ) : (
              materials.map((m) => (
                <tr key={m._id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.unit}</td>
                  <td className="px-4 py-3 text-muted-foreground">{m.price ? `${m.price} DA` : "—"}</td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold",
                      m.stockQuantity > 10 ? "bg-green-500/10 text-green-600" :
                        m.stockQuantity > 0 ? "bg-amber-500/10 text-amber-600" :
                          "bg-red-500/10 text-red-600"
                    )}>
                      {m.stockQuantity} {m.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-emerald-500 hover:bg-emerald-500/10 hover:text-emerald-600"
                        title="Arrivage (Entrée)"
                        onClick={() => setLogModal({ isOpen: true, type: "IN", material: m, quantity: "", notes: "", deliveredBy: "", supplier: "", bonLivraison: "" })}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                        title="Sortie (Sortie)"
                        onClick={() => setLogModal({ isOpen: true, type: "OUT", material: m, quantity: "", notes: "", deliveredBy: "", supplier: "", bonLivraison: "" })}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-amber-500/10 hover:text-amber-500" onClick={() => handleEdit(m)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-red-500/10 hover:text-red-500" onClick={() => handleDelete(m._id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Quick Log Modal (IN/OUT) */}
      <Dialog open={logModal.isOpen} onOpenChange={(open) => !open && setLogModal(prev => ({ ...prev, isOpen: false }))}>
        <DialogContent className={cn("transition-all duration-300", logModal.type === "IN" ? "sm:max-w-[460px]" : "sm:max-w-[420px]")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              {logModal.type === "IN" ? (
                <div className="flex items-center gap-2 text-emerald-500">
                  <ArrowDownLeft className="h-5 w-5" />
                  <span>Nouvel arrivage (Entrée de stock)</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 text-rose-500">
                  <ArrowUpRight className="h-5 w-5" />
                  <span>Nouvelle sortie (Retrait de stock)</span>
                </div>
              )}
            </DialogTitle>
            <DialogDescription>
              Enregistrer un mouvement de stock pour le matériau <strong className="text-foreground">{logModal.material?.name}</strong>.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleQuickLogSubmit} className="space-y-4 pt-2">
            <div className="rounded-xl bg-muted/50 p-3 border border-border/40 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Catégorie:</span>
                <span className="font-semibold">{logModal.material?.category || "Standard"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Stock Actuel:</span>
                <span className="font-semibold">{logModal.material?.stockQuantity} {logModal.material?.unit}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Prix Unitaire:</span>
                <span className="font-semibold">{logModal.material?.price ? `${logModal.material.price.toLocaleString()} DA` : "—"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="log-qty" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Quantité ({logModal.material?.unit})
              </label>
              <input
                id="log-qty"
                type="number"
                step="any"
                min="0.001"
                placeholder="Entrez la quantité"
                value={logModal.quantity}
                onChange={(e) => setLogModal(prev => ({ ...prev, quantity: e.target.value }))}
                required
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
              />
            </div>

            {logModal.type === "IN" && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                <div className="space-y-1.5">
                  <label htmlFor="log-supplier" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Fournisseur
                  </label>
                  <input
                    id="log-supplier"
                    type="text"
                    placeholder="Nom du fournisseur"
                    value={logModal.supplier}
                    onChange={(e) => setLogModal(prev => ({ ...prev, supplier: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="log-livreur" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Livreur (Livreur)
                  </label>
                  <input
                    id="log-livreur"
                    type="text"
                    placeholder="Nom du livreur"
                    value={logModal.deliveredBy}
                    onChange={(e) => setLogModal(prev => ({ ...prev, deliveredBy: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label htmlFor="log-bon" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    Bon de livraison (Bon de livraison)
                  </label>
                  <input
                    id="log-bon"
                    type="text"
                    placeholder="N° de bon de livraison"
                    value={logModal.bonLivraison}
                    onChange={(e) => setLogModal(prev => ({ ...prev, bonLivraison: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="log-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Notes (Optionnel)
              </label>
              <textarea
                id="log-notes"
                placeholder="Détails supplémentaires..."
                value={logModal.notes}
                onChange={(e) => setLogModal(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full min-h-[70px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setLogModal(prev => ({ ...prev, isOpen: false }))}>
                Annuler
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={saving}
                className={cn(
                  "text-white font-medium",
                  logModal.type === "IN"
                    ? "bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/10"
                    : "bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/10"
                )}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─────────────────────── ATTENDANCE TAB ───────────────────────
function AttendanceTab({ projectId }: { projectId: string }) {
  const [week, setWeek] = useState(() => {
    const now = new Date()
    const year = now.getFullYear()
    const startOfYear = new Date(year, 0, 1)
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
    return `${year}-W${String(Math.ceil((days + startOfYear.getDay() + 1) / 7)).padStart(2, "0")}`
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
                    {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(day => (
                      <td key={day} className="px-3 py-3 text-center">
                        {record[day] ? (
                          <Check className="h-4 w-4 text-green-500 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                        )}
                      </td>
                    ))}
                    <td className="px-3 py-3">
                      <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5 font-semibold">
                        {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].filter(d => record[d]).length}j
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
    const startOfYear = new Date(year, 0, 1)
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / 86400000)
    return `${year}-W${String(Math.ceil((days + startOfYear.getDay() + 1) / 7)).padStart(2, "0")}`
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
  const [week, setWeek] = useState(() => {
    const d = new Date()
    const year = d.getFullYear()
    const oneJan = new Date(year, 0, 1)
    const numberOfDays = Math.floor((d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000))
    const weekNum = Math.ceil((numberOfDays + oneJan.getDay() + 1) / 7)
    return `${year}-W${weekNum.toString().padStart(2, '0')}`
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

  const generateReport = async (type: string, label: string) => {
    setGenerating(type)
    try {
      const res = await api.post("/reports/generate", { projectId, type, week }, { responseType: "blob" })
      const url = window.URL.createObjectURL(new Blob([res.data]))
      const link = document.createElement("a")
      link.href = url
      link.setAttribute("download", `${label}-${projectName}-${new Date().toISOString().slice(0, 10)}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      toast.success(`Rapport ${label} généré`)
    } catch {
      toast.error("Erreur lors de la génération du rapport")
    } finally {
      setGenerating(null)
    }
  }

  const reportTypes = [
    { type: "materials", label: "Matériaux", icon: Package, desc: "Liste complète des matériaux, stocks et mouvements" },
    { type: "salary", label: "Salaires", icon: DollarSign, desc: "Récapitulatif hebdomadaire des salaires par travailleur" },
    { type: "attendance", label: "Présences", icon: CalendarDays, desc: "Tableau de présence hebdomadaire des travailleurs" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass p-4 rounded-2xl border border-amber-500/10">
        <div>
          <h3 className="font-bold text-lg tracking-tight">Générer un Rapport</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold mt-0.5">Sélectionnez la période</p>
        </div>
        <div className="flex items-center gap-3 bg-background/50 p-2 rounded-xl border border-border">
          <CalendarDays className="h-4 w-4 text-amber-500" />
          <input
            type="week"
            value={week}
            onChange={(e) => setWeek(e.target.value)}
            className="bg-transparent border-none text-sm font-medium focus:outline-none"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {reportTypes.map(({ type, label, icon: Icon, desc }) => (
          <div
            key={type}
            className="rounded-2xl border border-border bg-card p-5 flex flex-col gap-4 hover:border-amber-500/30 transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Icon className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
            <Button
              className="w-full bg-amber-500 hover:bg-amber-600 text-white rounded-xl gap-2"
              size="sm"
              disabled={generating === type}
              onClick={() => generateReport(type, label)}
            >
              {generating === type ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Télécharger PDF
            </Button>
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
