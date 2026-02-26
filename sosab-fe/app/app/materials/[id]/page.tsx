"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { format } from "date-fns"
import {
    Package,
    ChevronLeft,
    ArrowDownLeft,
    Calendar,
    User,
    Truck,
    Store,
    FileText,
    Image as ImageIcon,
    Pencil,
    Trash2,
    X,
    Loader2,
    Check
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { useLanguage } from "@/lib/language-context"

export default function MaterialDetailsPage() {
    const { t } = useLanguage()
    const params = useParams()
    const router = useRouter()
    const [logs, setLogs] = useState<any[]>([])
    const [material, setMaterial] = useState<any>(null)
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // Material edit state
    const [showEdit, setShowEdit] = useState(false)
    const [editForm, setEditForm] = useState({ name: '', unit: '', category: '', supplier: '' })
    const [savingEdit, setSavingEdit] = useState(false)

    // Material delete state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [deleting, setDeleting] = useState(false)

    // Log edit state
    const [editingLog, setEditingLog] = useState<any | null>(null)
    const [logEditForm, setLogEditForm] = useState({
        date: '',
        quantity: '',
        supplier: '',
        bonLivraison: '',
        notes: ''
    })
    const [savingLog, setSavingLog] = useState(false)

    const fetchDetails = async () => {
        try {
            setLoading(true)
            const res = await api.get(`/materials/logs/${params.id}`)
            if (res.data.success) {
                setLogs(res.data.data)
                setSummary(res.data.summary)
                if (res.data.data.length > 0) {
                    setMaterial(res.data.data[0].materialId)
                }
            }
        } catch (error) {
            console.error("Failed to load logs", error)
            toast.error(t("materials.failed_to_load_history"))
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDetails()
    }, [params.id])

    // ── Material edit/delete ──────────────────────────────────────────────────
    const openEdit = () => {
        setEditForm({
            name: material?.name || '',
            unit: material?.unit || '',
            category: material?.category || '',
            supplier: material?.supplier || ''
        })
        setShowEdit(true)
    }

    const handleSaveEdit = async () => {
        if (!editForm.name || !editForm.unit) return toast.error('Name and unit are required')
        try {
            setSavingEdit(true)
            await api.patch(`/materials/item/${params.id}`, editForm)
            toast.success('Material updated!')
            setMaterial((prev: any) => ({ ...prev, ...editForm }))
            setShowEdit(false)
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update material')
        } finally {
            setSavingEdit(false)
        }
    }

    const handleDelete = async () => {
        try {
            setDeleting(true)
            await api.delete(`/materials/item/${params.id}`)
            toast.success('Material deleted')
            router.replace('/app/materials')
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to delete material')
            setDeleting(false)
            setShowDeleteConfirm(false)
        }
    }

    // ── Log edit ─────────────────────────────────────────────────────────────
    const openLogEdit = (log: any) => {
        setEditingLog(log)
        setLogEditForm({
            date: format(new Date(log.date || log.createdAt), "yyyy-MM-dd"),
            quantity: String(log.quantity),
            supplier: log.supplier || '',
            bonLivraison: log.bonLivraison || '',
            notes: log.notes || ''
        })
    }

    const handleSaveLog = async () => {
        if (!logEditForm.quantity || isNaN(Number(logEditForm.quantity))) return toast.error('Enter a valid quantity')
        try {
            setSavingLog(true)
            await api.patch(`/materials/log/${editingLog._id}`, {
                date: logEditForm.date,
                quantity: parseFloat(logEditForm.quantity),
                supplier: logEditForm.supplier,
                bonLivraison: logEditForm.bonLivraison,
                notes: logEditForm.notes
            })
            toast.success('Delivery updated!')
            setEditingLog(null)
            await fetchDetails()
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update delivery')
        } finally {
            setSavingLog(false)
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">{t("materials.loading_history")}</p>
            </div>
        )
    }

    if (!logs.length && !loading) {
        return (
            <div className="p-4 space-y-4 max-w-md mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-2">
                    <ChevronLeft className="w-4 h-4 mr-1" /> {t("common.cancel")}
                </Button>
                <Card className="border-dashed border-2 py-20 text-center">
                    <CardContent>
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h2 className="font-bold text-lg">{t("materials.no_history")}</h2>
                        <p className="text-muted-foreground">{t("materials.no_history_desc")}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
            <div className="space-y-4">
                {/* Back */}
                <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4 h-8 text-muted-foreground hover:text-primary">
                    <ChevronLeft className="w-4 h-4 mr-1" /> {t("materials.back_to_inventory")}
                </Button>

                {/* Title + Material Edit/Delete */}
                <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                        <h1 className="text-3xl font-display font-black tracking-tight truncate">{material?.name}</h1>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-[10px] font-bold uppercase py-0">{material?.unit}</Badge>
                            <span className="text-muted-foreground text-sm font-medium">{t("materials.arrival_journal")}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0 pt-1">
                        <button onClick={openEdit} className="h-9 w-9 rounded-xl bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors" title="Edit material">
                            <Pencil className="w-4 h-4 text-primary" />
                        </button>
                        <button onClick={() => setShowDeleteConfirm(true)} className="h-9 w-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center transition-colors" title="Delete material">
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                    </div>
                </div>

                {/* Summary Card */}
                <Card className="bg-success/5 border-success/20 overflow-hidden shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="text-[10px] uppercase font-black text-success/60 tracking-wider">{t("materials.total_lifetime_volume")}</div>
                            <div className="text-3xl font-display font-black text-success">
                                {summary?.totalIn} <span className="text-xs font-bold uppercase opacity-60 ml-0.5">{material?.unit}</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center">
                            <ArrowDownLeft className="w-6 h-6 text-success" />
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">{t("materials.delivery_timeline")}</label>
                        <span className="text-[10px] font-bold text-muted-foreground/40">{logs.length} {t("materials.entries_plural")}</span>
                    </div>

                    <div className="space-y-4 relative before:absolute before:inset-0 before:left-[19px] before:w-px before:bg-border/50">
                        {logs.map((log) => (
                            <div key={log._id} className="relative pl-10 space-y-2">
                                <div className="absolute left-0 top-1 h-10 w-10 flex items-center justify-center">
                                    <div className="h-3 w-3 rounded-full bg-background border-2 border-primary shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)] z-10" />
                                </div>

                                <Card className="border-border/50 shadow-sm overflow-hidden">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-0.5">
                                                <div className="text-lg font-display font-black text-primary">
                                                    +{log.quantity} <span className="text-[10px] font-bold uppercase text-muted-foreground/60">{material?.unit}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(log.date || log.createdAt), 'MMM dd, yyyy • HH:mm')}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                {log.photos && log.photos.length > 0 && (
                                                    <Badge variant="secondary" className="h-5 px-1.5 bg-muted text-[9px] font-bold">
                                                        <ImageIcon className="w-3 h-3 mr-1" /> {log.photos.length}
                                                    </Badge>
                                                )}
                                                {/* Edit this log entry */}
                                                <button
                                                    onClick={() => openLogEdit(log)}
                                                    className="h-7 w-7 rounded-lg bg-primary/10 hover:bg-primary/20 flex items-center justify-center transition-colors"
                                                    title="Edit this delivery"
                                                >
                                                    <Pencil className="w-3 h-3 text-primary" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed">
                                            <div className="space-y-1">
                                                <div className="text-[9px] uppercase font-black text-muted-foreground/50 flex items-center gap-1">
                                                    <Truck className="w-2.5 h-2.5" /> {t("materials.driver_label")}
                                                </div>
                                                <div className="text-[11px] font-bold truncate">{log.deliveredBy || 'N/A'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] uppercase font-black text-muted-foreground/50 flex items-center gap-1">
                                                    <Store className="w-2.5 h-2.5" /> {t("materials.supplier_label")}
                                                </div>
                                                <div className="text-[11px] font-bold truncate">{log.supplier || 'N/A'}</div>
                                            </div>
                                            {log.bonLivraison && (
                                                <div className="col-span-2 space-y-1">
                                                    <div className="text-[9px] uppercase font-black text-muted-foreground/50 flex items-center gap-1">
                                                        <FileText className="w-2.5 h-2.5" /> N° Bon de Livraison
                                                    </div>
                                                    <div className="text-[11px] font-bold font-mono">{log.bonLivraison}</div>
                                                </div>
                                            )}
                                        </div>

                                        {log.notes && (
                                            <div className="p-2.5 bg-muted/40 rounded-lg text-[11px] font-medium leading-relaxed text-muted-foreground border border-border/10">
                                                <span className="uppercase text-[9px] font-black opacity-40 block mb-0.5 tracking-tighter">{t("materials.notes_label")}</span>
                                                {log.notes}
                                            </div>
                                        )}

                                        {log.photos && log.photos.length > 0 && (
                                            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                                                {log.photos.map((photo: any, i: number) => (
                                                    <img
                                                        key={i}
                                                        src={photo.url?.startsWith('http') ? photo.url : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}${photo.url}`}
                                                        alt="Evidence"
                                                        className="h-14 w-14 rounded-lg object-cover flex-shrink-0 border border-border/50"
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        <div className="pt-2 flex items-center justify-end border-t border-border/30">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-muted-foreground/40 uppercase">
                                                <User className="w-3 h-3" />
                                                Logged By: {log.loggedBy?.name || 'Unknown'}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Material Edit Modal ── */}
            {showEdit && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center pb-6 px-4" onClick={() => setShowEdit(false)}>
                    <div className="w-full max-w-sm bg-card rounded-2xl p-5 border border-white/10 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                <Pencil className="w-4 h-4 text-primary" /> Edit Material
                            </h3>
                            <button onClick={() => setShowEdit(false)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Name</Label>
                                <Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} className="bg-background/50 border-white/10" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Unit</Label>
                                    <Input value={editForm.unit} onChange={e => setEditForm({ ...editForm, unit: e.target.value })} className="bg-background/50 border-white/10" />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Category</Label>
                                    <Input value={editForm.category} onChange={e => setEditForm({ ...editForm, category: e.target.value })} className="bg-background/50 border-white/10" />
                                </div>
                            </div>
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Supplier</Label>
                                <Input value={editForm.supplier} onChange={e => setEditForm({ ...editForm, supplier: e.target.value })} className="bg-background/50 border-white/10" />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setShowEdit(false)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleSaveEdit} disabled={savingEdit}>
                                {savingEdit ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Log Edit Modal ── */}
            {editingLog && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center pb-6 px-4" onClick={() => setEditingLog(null)}>
                    <div className="w-full max-w-sm bg-card rounded-2xl p-5 border border-white/10 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-sm uppercase tracking-wider flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-primary" /> Edit Delivery
                            </h3>
                            <button onClick={() => setEditingLog(null)} className="p-1 rounded-lg hover:bg-white/10"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="space-y-3">
                            {/* Date */}
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1">
                                    <Calendar className="w-3 h-3" /> Date
                                </Label>
                                <Input
                                    type="date"
                                    value={logEditForm.date}
                                    onChange={e => setLogEditForm({ ...logEditForm, date: e.target.value })}
                                    className="bg-background/50 border-white/10"
                                />
                            </div>
                            {/* Quantity */}
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Quantité ({material?.unit})</Label>
                                <Input
                                    type="number"
                                    value={logEditForm.quantity}
                                    onChange={e => setLogEditForm({ ...logEditForm, quantity: e.target.value })}
                                    className="bg-background/50 border-white/10"
                                />
                            </div>
                            {/* Supplier */}
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fournisseur</Label>
                                <Input
                                    value={logEditForm.supplier}
                                    onChange={e => setLogEditForm({ ...logEditForm, supplier: e.target.value })}
                                    className="bg-background/50 border-white/10"
                                />
                            </div>
                            {/* Bon de Livraison */}
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">N° Bon de Livraison</Label>
                                <Input
                                    value={logEditForm.bonLivraison}
                                    onChange={e => setLogEditForm({ ...logEditForm, bonLivraison: e.target.value })}
                                    className="bg-background/50 border-white/10"
                                    placeholder="Ex: BL-2024-0123"
                                />
                            </div>
                            {/* Notes */}
                            <div className="space-y-1">
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Notes</Label>
                                <Input
                                    value={logEditForm.notes}
                                    onChange={e => setLogEditForm({ ...logEditForm, notes: e.target.value })}
                                    className="bg-background/50 border-white/10"
                                />
                            </div>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setEditingLog(null)}>Cancel</Button>
                            <Button className="flex-1" onClick={handleSaveLog} disabled={savingLog}>
                                {savingLog ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />} Save
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Delete Confirm Modal ── */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end justify-center pb-6 px-4" onClick={() => setShowDeleteConfirm(false)}>
                    <div className="w-full max-w-sm bg-card rounded-2xl p-5 border border-red-500/20 space-y-4 shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-red-500/10 flex items-center justify-center flex-shrink-0">
                                <Trash2 className="w-5 h-5 text-red-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm">Delete Material?</h3>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    This will permanently delete <strong>{material?.name}</strong> and all its delivery logs.
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="ghost" className="flex-1" onClick={() => setShowDeleteConfirm(false)}>Cancel</Button>
                            <Button variant="destructive" className="flex-1" onClick={handleDelete} disabled={deleting}>
                                {deleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />} Delete
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
