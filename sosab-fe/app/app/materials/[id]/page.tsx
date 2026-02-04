"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
    Image as ImageIcon
} from "lucide-react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

export default function MaterialDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [logs, setLogs] = useState<any[]>([])
    const [material, setMaterial] = useState<any>(null)
    const [summary, setSummary] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
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
                toast.error("Failed to load history")
            } finally {
                setLoading(false)
            }
        }
        fetchDetails()
    }, [params.id])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="h-10 w-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Loading History...</p>
            </div>
        )
    }

    if (!logs.length && !loading) {
        return (
            <div className="p-4 space-y-4 max-w-md mx-auto">
                <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-2">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                </Button>
                <Card className="border-dashed border-2 py-20 text-center">
                    <CardContent>
                        <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <h2 className="font-bold text-lg">No history found</h2>
                        <p className="text-muted-foreground">We couldn't find any arrival records for this item.</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
            <div className="space-y-4">
                <Button variant="ghost" onClick={() => router.back()} className="mb-2 -ml-4 h-8 text-muted-foreground hover:text-primary">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back to Inventory
                </Button>

                <div className="space-y-1">
                    <h1 className="text-3xl font-display font-black tracking-tight">{material?.name}</h1>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-bold uppercase py-0">{material?.unit}</Badge>
                        <span className="text-muted-foreground text-sm font-medium">Arrival Journal</span>
                    </div>
                </div>

                {/* Quick Summary Card */}
                <Card className="bg-success/5 border-success/20 overflow-hidden shadow-sm">
                    <CardContent className="p-5 flex items-center justify-between">
                        <div className="space-y-0.5">
                            <div className="text-[10px] uppercase font-black text-success/60 tracking-wider">Total Lifetime Volume</div>
                            <div className="text-3xl font-display font-black text-success">
                                {summary?.totalIn} <span className="text-xs font-bold uppercase opacity-60 ml-0.5">{material?.unit}</span>
                            </div>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center">
                            <ArrowDownLeft className="w-6 h-6 text-success" />
                        </div>
                    </CardContent>
                </Card>

                {/* Timeline of Arrivals */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] uppercase font-black text-muted-foreground/60 tracking-widest">Delivery Timeline</label>
                        <span className="text-[10px] font-bold text-muted-foreground/40">{logs.length} ENTRIES</span>
                    </div>

                    <div className="space-y-4 relative before:absolute before:inset-0 before:left-[19px] before:w-px before:bg-border/50">
                        {logs.map((log) => (
                            <div key={log._id} className="relative pl-10 space-y-2">
                                {/* Dot */}
                                <div className="absolute left-0 top-1 h-10 w-10 flex items-center justify-center">
                                    <div className="h-3 w-3 rounded-full bg-background border-2 border-primary shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.1)] z-10" />
                                </div>

                                <Card className="border-border/50 shadow-sm overflow-hidden active:scale-[0.99] transition-transform">
                                    <CardContent className="p-4 space-y-4">
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-0.5">
                                                <div className="text-lg font-display font-black text-primary">
                                                    +{log.quantity} <span className="text-[10px] font-bold uppercase text-muted-foreground/60">{material?.unit}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground/80 uppercase">
                                                    <Calendar className="w-3 h-3" />
                                                    {format(new Date(log.createdAt), 'MMM dd, yyyy • HH:mm')}
                                                </div>
                                            </div>
                                            {log.photos && log.photos.length > 0 && (
                                                <Badge variant="secondary" className="h-5 px-1.5 bg-muted text-[9px] font-bold">
                                                    <ImageIcon className="w-3 h-3 mr-1" /> {log.photos.length}
                                                </Badge>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-dashed">
                                            <div className="space-y-1">
                                                <div className="text-[9px] uppercase font-black text-muted-foreground/50 flex items-center gap-1">
                                                    <Truck className="w-2.5 h-2.5" /> Chauffeur
                                                </div>
                                                <div className="text-[11px] font-bold truncate">{log.deliveredBy || 'N/A'}</div>
                                            </div>
                                            <div className="space-y-1">
                                                <div className="text-[9px] uppercase font-black text-muted-foreground/50 flex items-center gap-1">
                                                    <Store className="w-2.5 h-2.5" /> Supplier
                                                </div>
                                                <div className="text-[11px] font-bold truncate">{log.supplier || 'N/A'}</div>
                                            </div>
                                        </div>

                                        {log.notes && (
                                            <div className="p-2.5 bg-muted/40 rounded-lg text-[11px] font-medium leading-relaxed text-muted-foreground border border-border/10">
                                                <span className="uppercase text-[9px] font-black opacity-40 block mb-0.5 tracking-tighter">Notes</span>
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
        </div>
    )
}
