"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, MapPin, Calendar as CalendarIcon, CheckSquare, Users as UsersIcon, Clock, AlertCircle, Trash2, ChevronDown, ChevronUp, HardHat, FileText, ArrowUpRight, ArrowDownLeft, Search, ChevronRight, Package, X } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLanguage } from "@/lib/language-context"
import { MATERIAL_CATALOG, ALL_CLASSIFICATION_NAMES } from "@/lib/material-catalog"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export default function MobileProjectDetails() {
    const { id } = useParams()
    const router = useRouter()
    const { t } = useLanguage()
    const searchParams = useSearchParams()
    const activeTab = searchParams.get('tab') || 'overview'

    // State
    const [project, setProject] = useState<any>(null)
    const [team, setTeam] = useState<any[]>([])
    const [materialLogs, setMaterialLogs] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    // Report Form State
    const [reportForm, setReportForm] = useState({
        workCompleted: '',
        issues: '',
        materialsUsed: [] as { materialId?: string, quantity: number, name: string, unit: string, category: string }[],
        photos: null as FileList | null
    })
    const [tempMaterial, setTempMaterial] = useState({ id: '', quantity: '', name: '', unit: '', category: '' })
    const [materialSearch, setMaterialSearch] = useState('')
    const [showMaterialSuggestions, setShowMaterialSuggestions] = useState(false)
    const [submittingReport, setSubmittingReport] = useState(false)

    const [showRegisterUsage, setShowRegisterUsage] = useState(false)
    const [usageForm, setUsageForm] = useState({ materialId: '', quantity: '', notes: '', name: '', unit: '', category: '' })
    const [projectMaterials, setProjectMaterials] = useState<any[]>([])
    const [expandedSub, setExpandedSub] = useState<string | null>(null)

    // Out modal state
    const [showOutModal, setShowOutModal] = useState(false)
    const [outForm, setOutForm] = useState({ materialId: '', quantity: '', notes: '', name: '', unit: '', category: '' })
    const [submittingOut, setSubmittingOut] = useState(false)

    // Selection UI state (Shared for modals)
    const [pickerModalType, setPickerModalType] = useState<"usage" | "out" | "report" | null>(null)
    const [selectedClassification, setSelectedClassification] = useState("")
    const [classQuery, setClassQuery] = useState("")
    const [showClassSuggestions, setShowClassSuggestions] = useState(false)

    // Worker management state
    const [showAddWorker, setShowAddWorker] = useState(false)
    const [isAddingWorker, setIsAddingWorker] = useState(false)
    const [showDeleteWorkerList, setShowDeleteWorkerList] = useState(false)
    const [editingWorker, setEditingWorker] = useState<any>(null)

    const [createWorkerForm, setCreateWorkerForm] = useState({
        name: '',
        trade: '',
        phone: '',
        dailySalary: '',
        supervisorId: '',
        isSubcontractor: false
    })

    // Derived state: Get list of Sous Traitants for dropdown
    const subcontractors = team.filter(w => w.trade === 'Sous Traitant');

    // Attendance State
    const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({})
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                setLoading(true)
                const todayStr = format(new Date(), 'yyyy-MM-dd')
                // Fetch basic data
                const [projectRes, teamRes, logsRes, attRes] = await Promise.all([
                    api.get(`/projects/${id}`),
                    api.get(`/projects/${id}/team`),
                    api.get(`/materials/projects/${id}/logs`),
                    api.get(`/attendance/project/${id}/date/${todayStr}`) // New
                ])

                if (projectRes.data.success) setProject(projectRes.data.data)
                if (teamRes.data.success) setTeam(teamRes.data.data)
                if (logsRes.data.success) setMaterialLogs(logsRes.data.data)

                const matRes = await api.get(`/materials/${id}`)
                if (matRes.data.success) setProjectMaterials(matRes.data.data)
                // Process attendance
                if (attRes.data?.success) {
                    const map: Record<string, any> = {}
                    attRes.data.data.forEach((rec: any) => {
                        map[rec.workerId] = { present: rec.present, dayValue: rec.dayValue }
                    })
                    setAttendanceMap(map)
                }

            } catch (error) {
                console.error("Failed to load project data", error)
                toast.error("Loaded partial data")
            } finally {
                setLoading(false)
            }
        }

        if (id) fetchProjectData()
    }, [id])

    // Fetch attendance for selected date
    useEffect(() => {
        const fetchAttendance = async () => {
            if (!id || !selectedDate) return
            try {
                const dateStr = format(selectedDate, 'yyyy-MM-dd')
                const attRes = await api.get(`/attendance/project/${id}/date/${dateStr}`)
                if (attRes.data?.success) {
                    const map: Record<string, any> = {}
                    attRes.data.data.forEach((rec: any) => {
                        map[rec.workerId] = { present: rec.present, dayValue: rec.dayValue }
                    })
                    setAttendanceMap(map)
                } else {
                    setAttendanceMap({}) // Clear if no data
                }
            } catch (error) {
                console.error("Failed to fetch attendance", error)
                setAttendanceMap({})
            }
        }
        fetchAttendance()
    }, [id, selectedDate])

    const handleMarkAttendance = async (workerId: string, present: boolean, dayValue: number = 1) => {
        // Optimistic update: capture current state to revert if needed
        const previousState = attendanceMap[workerId]

        // Update local state immediately for instant UI feedback
        setAttendanceMap(prev => ({
            ...prev,
            [workerId]: { present, dayValue }
        }))

        try {
            const dateString = format(selectedDate, 'yyyy-MM-dd')
            await api.post('/attendance', { workerId, projectId: id, date: dateString, present, dayValue })

            // Show success toast in background
            toast.success(`${t("projects.marked_as")} ${present ? t("projects.present") : t("projects.absent")} (${dayValue}x)`)
        } catch (error) {
            console.error("Failed to mark attendance:", error)
            toast.error("Failed to update status. Please try again.")

            // Rollback to previous state on error
            setAttendanceMap(prev => ({
                ...prev,
                [workerId]: previousState
            }))
        }
    }

    const handleSubmitReport = async () => {
        if (!reportForm.workCompleted && !reportForm.issues) return toast.error("Please enter details")

        try {
            setSubmittingReport(true)
            const formData = new FormData()
            formData.append('projectId', id as string)
            formData.append('workCompleted', reportForm.workCompleted)
            formData.append('issues', reportForm.issues)
            formData.append('materialsUsed', JSON.stringify(reportForm.materialsUsed.map(m => ({ materialId: m.materialId, quantity: m.quantity }))))
            formData.append('date', selectedDate.toISOString())

            if (reportForm.photos) {
                Array.from(reportForm.photos).forEach(file => {
                    formData.append('photos', file)
                })
            }

            // Must set Content-Type header usually handled by axios for FormData
            await api.post('/daily-reports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success(t("projects.report_sent") || "Daily Report Sent!")
            setReportForm({ workCompleted: '', issues: '', materialsUsed: [], photos: null })
        } catch (error) {
            console.error(error)
            toast.error("Failed to send report")
        } finally {
            setSubmittingReport(false)
        }
    }


    const handleRegisterUsage = async () => {
        if (!usageForm.quantity) return toast.error("Please enter quantity")
        if (!usageForm.materialId && !usageForm.name) return toast.error("Please select a material")

        try {
            await api.post('/materials/quick-log', {
                projectId: id,
                materialId: usageForm.materialId || undefined,
                materialName: usageForm.name,
                unit: usageForm.unit,
                category: usageForm.category,
                type: 'OUT',
                quantity: parseFloat(usageForm.quantity),
                notes: usageForm.notes
            })
            toast.success("Usage Registered!")
            setShowRegisterUsage(false)
            setUsageForm({ materialId: '', quantity: '', notes: '', name: '', unit: '', category: '' })

            // Refresh
            const logsRes = await api.get(`/materials/projects/${id}/logs`)
            if (logsRes.data.success) setMaterialLogs(logsRes.data.data)
            const matRes = await api.get(`/materials/${id}`)
            if (matRes.data.success) setProjectMaterials(matRes.data.data)
        } catch (error) {
            toast.error("Failed to register usage")
        }
    }

    const handleRegisterOut = async () => {
        if (!outForm.quantity) return toast.error("Please enter quantity")
        if (!outForm.materialId && !outForm.name) return toast.error("Please select a material")

        try {
            setSubmittingOut(true)
            await api.post('/materials/quick-log', {
                projectId: id,
                materialId: outForm.materialId || undefined,
                materialName: outForm.name,
                unit: outForm.unit,
                category: outForm.category,
                type: 'OUT',
                quantity: parseFloat(outForm.quantity),
                notes: outForm.notes
            })
            toast.success(t("projects.out_success") || "Material Out Logged!")
            setShowOutModal(false)
            setOutForm({ materialId: '', quantity: '', notes: '', name: '', unit: '', category: '' })

            // Refresh logs and materials
            const logsRes = await api.get(`/materials/projects/${id}/logs`)
            if (logsRes.data.success) setMaterialLogs(logsRes.data.data)
            const matRes = await api.get(`/materials/${id}`)
            if (matRes.data.success) setProjectMaterials(matRes.data.data)
        } catch (error) {
            toast.error("Failed to log material out")
        } finally {
            setSubmittingOut(false)
        }
    }


    const handleAddWorker = async () => {
        // Validation
        if (!createWorkerForm.name) return toast.error("Enter Name")
        if (!createWorkerForm.trade) return toast.error("Enter Role (Trade)")
        if (!createWorkerForm.dailySalary) return toast.error("Enter Salary")

        try {
            // Create New Worker assigned to this project
            await api.post('/workers', {
                name: createWorkerForm.name,
                trade: createWorkerForm.trade,
                dailySalary: Number(createWorkerForm.dailySalary),
                projectId: id,
                contact: { phone: createWorkerForm.phone },
                supervisorId: createWorkerForm.supervisorId || null,
                isSubcontractor: createWorkerForm.isSubcontractor
            })

            toast.success("Worker Created & Added!")
            setShowAddWorker(false)
            setCreateWorkerForm({ name: '', trade: '', phone: '', dailySalary: '', supervisorId: '', isSubcontractor: false })

            // Refresh team list
            const teamRes = await api.get(`/projects/${id}/team`)
            if (teamRes.data.success) setTeam(teamRes.data.data)

        } catch (error) {
            console.error(error)
            toast.error("Failed to create worker")
        }
    }

    const [deleteWorkerId, setDeleteWorkerId] = useState<string | null>(null)

    const handleDeleteWorker = async () => {
        if (!deleteWorkerId) return
        try {
            await api.delete(`/workers/${deleteWorkerId}`)
            toast.success("Worker Removed")
            setTeam(prev => prev.filter(w => w._id !== deleteWorkerId))
        } catch (error) {
            console.error("Failed to delete worker", error)
            toast.error("Failed to delete worker")
        } finally {
            setDeleteWorkerId(null)
        }
    }

    const handleUpdateWorker = async () => {
        if (!editingWorker || !editingWorker._id) return
        if (!editingWorker.name) return toast.error("Name is required")
        if (!editingWorker.trade) return toast.error("Role (Trade) is required")
        if (!editingWorker.dailySalary) return toast.error("Salary is required")

        try {
            await api.patch(`/workers/${editingWorker._id}`, {
                name: editingWorker.name,
                trade: editingWorker.trade,
                dailySalary: Number(editingWorker.dailySalary),
                contact: { phone: editingWorker.phone },
                supervisorId: editingWorker.supervisorId || null,
                isSubcontractor: editingWorker.isSubcontractor
            })

            toast.success("Worker Updated")
            setEditingWorker(null)

            // Refresh team
            const teamRes = await api.get(`/projects/${id}/team`)
            if (teamRes.data.success) setTeam(teamRes.data.data)

        } catch (error) {
            console.error("Failed to update worker", error)
            toast.error("Failed to update worker")
        }
    }

    if (loading) return (
        <div className="flex h-screen items-center justify-center bg-background">
            <div className="flex flex-col items-center gap-4 animate-pulse">
                <Spinner />
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">{t("projects.loading_project") || "Loading Project..."}</p>
            </div>
        </div>
    )
    if (!project) return null

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-20 gpu">
            {/* Decorative Background Elements - matching dashboard */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/5 bg-background/80 p-4 backdrop-blur-md transition-all">
                <Button variant="ghost" size="icon" onClick={() => router.push("/app")} className="hover:bg-primary/20 hover:text-primary rounded-xl">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-lg font-display font-bold tracking-tight">{project.name}</h1>
                </div>
            </div>

            <div className="p-4 relative z-10">
                <Tabs defaultValue={activeTab} onValueChange={(val) => router.replace(`/app/projects/${id}?tab=${val}`, { scroll: false })} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-card/40 backdrop-blur-md border border-white/5 p-1 rounded-xl h-auto">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium text-xs py-2 data-[state=active]:shadow-none focus:ring-0">{t("projects.overview")}</TabsTrigger>
                        <TabsTrigger value="report" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium text-xs py-2 data-[state=active]:shadow-none focus:ring-0">{t("projects.report")}</TabsTrigger>
                        <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium text-xs py-2 data-[state=active]:shadow-none focus:ring-0">{t("projects.attendance")}</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-4 mt-6 animate-in">

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center group">
                                <UsersIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                                <span className="text-2xl font-display font-bold">{team.length}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("projects.on_site")}</span>
                            </div>
                            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center group">
                                <Clock className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                                <span className="text-xs font-display font-bold mt-2">{materialLogs.length} {t("projects.activity")}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("projects.activity_label") || "Activity"}</span>
                            </div>
                        </div>

                        {/* Inventory Card */}
                        <div className="glass-card rounded-2xl p-0 overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Materials Log</h3>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-red-500/20 hover:bg-red-500/10 text-red-500" onClick={() => setShowOutModal(true)}>
                                        {t("projects.out") || "- Out"}
                                    </Button>
                                    <Button size="sm" variant="outline" className="h-7 text-xs border-primary/20 hover:bg-primary/10 text-primary" onClick={() => router.push(`/app/scan?projectId=${id}&type=in`)}>
                                        {t("projects.arrival") || "+ Arrival"}
                                    </Button>
                                </div>
                            </div>
                            <div className="p-0">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar gpu" style={{ contentVisibility: 'auto' } as any}>
                                    {materialLogs.length === 0 ? (
                                        <div className="p-6 text-center text-muted-foreground text-xs">{t("projects.no_recent_activity")}</div>
                                    ) : (
                                        materialLogs.map((log: any, i) => (
                                            <div key={log._id} className={`flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-black/20'}`}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.materialId?.name || t("common.material") || 'Material'}</span>
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(log.createdAt), 'MMM dd, HH:mm')}</span>
                                                </div>
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${log.type === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {log.type === 'IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                    {log.quantity} {log.materialId?.unit || log.unit || t("projects.unit")}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Team Management Card */}
                        <div className="glass-card rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <HardHat className="w-4 h-4 text-primary" /> {t("projects.team")}
                                </h3>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowDeleteWorkerList(true)}>{t("projects.members")}</Button>
                                    <Button size="sm" className="h-7 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 shadow-none" onClick={() => setShowAddWorker(true)}>{t("projects.add_worker")}</Button>
                                </div>
                            </div>
                            <div className="bg-background/40 rounded-xl p-3 border border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="flex -space-x-3">
                                        {team.slice(0, 4).map((m, i) => (
                                            <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                                                {m.name.charAt(0)}
                                            </div>
                                        ))}
                                        {team.length > 4 && (
                                            <div className="w-8 h-8 rounded-full border-2 border-background bg-card flex items-center justify-center text-[10px] font-bold text-muted-foreground shadow-sm">
                                                +{team.length - 4}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-muted-foreground font-medium">{team.length > 0 ? t("projects.active_crew") : t("projects.no_crew")}</span>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="glass-card rounded-2xl p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> {t("projects.location_label")}
                            </h3>
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium mb-1">{project.location}</p>
                            <p className="text-xs text-muted-foreground">{project.description}</p>
                        </div>

                    </TabsContent>


                    {/* REPORT PROBLEM TAB */}
                    <TabsContent value="report" className="space-y-4 mt-6 animate-in">
                        <div className="flex items-center justify-between mb-4 glass p-3 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-3">
                                {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),0.5)]" />
                                )}
                                <div>
                                    <h3 className="font-display font-bold text-sm tracking-tight text-foreground">
                                        {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? t("projects.daily_report") : t("projects.archive_report")}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? t("projects.submit_progress") : t("projects.view_past_report")}
                                    </p>
                                </div>
                            </div>
                            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="bg-background/50 text-xs font-black uppercase tracking-widest px-3 py-2 h-auto border-white/5 hover:bg-background/80 hover:border-primary/30 transition-all"
                                    >
                                        <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                                        {format(selectedDate, 'MMM dd')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setSelectedDate(date)
                                                setShowDatePicker(false)
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-primary/50">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <CheckSquare className="w-3 h-3 text-green-500" /> {t("projects.work_completed")}
                                    </label>
                                    <textarea
                                        className="w-full min-h-[100px] p-3 rounded-xl bg-background/50 border border-border/50 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 resize-none"
                                        placeholder={t("projects.work_placeholder") || "Detailed summary of work done today..."}
                                        value={reportForm.workCompleted}
                                        onChange={e => setReportForm({ ...reportForm, workCompleted: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <HardHat className="w-3 h-3 text-amber-500" /> {t("projects.materials_used")}
                                    </label>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex gap-2">
                                            <div className="flex-[2] relative">
                                                <Input
                                                    placeholder={t("projects.search_material")}
                                                    className="bg-background/50 border-border/50 text-sm h-11"
                                                    value={materialSearch}
                                                    onChange={e => {
                                                        setMaterialSearch(e.target.value)
                                                        setShowMaterialSuggestions(true)
                                                    }}
                                                    onFocus={() => setShowMaterialSuggestions(true)}
                                                />
                                                {showMaterialSuggestions && materialSearch.length > 0 && (
                                                    <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border border-border/50 rounded-xl shadow-xl max-h-[220px] overflow-y-auto glass animate-in fade-in slide-in-from-top-1">
                                                        {/* Classification Suggestions */}
                                                        {ALL_CLASSIFICATION_NAMES.filter(n => n.toLowerCase().includes(materialSearch.toLowerCase())).map(cat => (
                                                            <button
                                                                key={cat}
                                                                className="w-full text-left px-4 py-3 text-sm hover:bg-primary/10 transition-colors flex justify-between items-center border-b border-white/5"
                                                                onClick={() => {
                                                                    setSelectedClassification(cat)
                                                                    setPickerModalType("report")
                                                                    setShowMaterialSuggestions(false)
                                                                    setMaterialSearch("")
                                                                }}
                                                            >
                                                                <span className="font-bold flex items-center gap-2">
                                                                    <Search className="w-3.5 h-3.5 text-primary" /> {cat}
                                                                </span>
                                                                <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                                                            </button>
                                                        ))}

                                                        {/* Direct Material Suggestions from Project List */}
                                                        {projectMaterials.filter(m => m.name.toLowerCase().includes(materialSearch.toLowerCase())).map(m => (
                                                            <button
                                                                key={m._id}
                                                                className="w-full text-left px-4 py-3 text-sm hover:bg-primary/10 transition-colors flex justify-between items-center border-b border-white/5"
                                                                onClick={() => {
                                                                    setTempMaterial({
                                                                        id: m._id,
                                                                        name: m.name,
                                                                        unit: m.unit,
                                                                        category: m.category || t("materials.general"),
                                                                        quantity: tempMaterial.quantity
                                                                    })
                                                                    setMaterialSearch(m.name)
                                                                    setShowMaterialSuggestions(false)
                                                                }}
                                                            >
                                                                <span className="font-medium">{m.name}</span>
                                                                <span className="text-[10px] text-muted-foreground font-bold uppercase">{m.stockQuantity} {m.unit}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <Input
                                                type="number"
                                                placeholder="Qty"
                                                className="flex-1 bg-background/50 border-border/50 h-11"
                                                value={tempMaterial.quantity}
                                                onChange={e => setTempMaterial(prev => ({ ...prev, quantity: e.target.value }))}
                                            />
                                            <Button
                                                size="sm"
                                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-11 px-4"
                                                onClick={() => {
                                                    if (!tempMaterial.name || !tempMaterial.quantity) {
                                                        toast.error("Please select a material and enter quantity")
                                                        return;
                                                    }
                                                    setReportForm(prev => ({
                                                        ...prev,
                                                        materialsUsed: [...prev.materialsUsed, {
                                                            materialId: tempMaterial.id || undefined,
                                                            quantity: Number(tempMaterial.quantity),
                                                            name: tempMaterial.name,
                                                            unit: tempMaterial.unit,
                                                            category: tempMaterial.category
                                                        }]
                                                    }));
                                                    setTempMaterial({ id: '', quantity: '', name: '', unit: '', category: '' });
                                                    setMaterialSearch('');
                                                }}
                                            >
                                                Add
                                            </Button>
                                        </div>

                                        {/* Helper to show what's selected before adding */}
                                        {tempMaterial.name && (
                                            <div className="flex items-center justify-between p-2 rounded-lg bg-primary/5 border border-primary/20 animate-in fade-in">
                                                <div className="flex items-center gap-2">
                                                    <Package className="w-3.5 h-3.5 text-primary" />
                                                    <span className="text-xs font-bold">{tempMaterial.name} ({tempMaterial.unit})</span>
                                                </div>
                                                <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => setTempMaterial({ ...tempMaterial, name: '', id: '' })}>
                                                    <X className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {reportForm.materialsUsed.length > 0 && (
                                        <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-xl border border-white/5">
                                            {reportForm.materialsUsed.map((m, idx) => (
                                                <Badge key={idx} variant="secondary" className="bg-primary/10 text-primary border-primary/20 py-1 pl-3 pr-1 flex items-center gap-2">
                                                    {m.name}: {m.quantity}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-4 w-4 rounded-full hover:bg-red-500/20 hover:text-red-500"
                                                        onClick={() => {
                                                            setReportForm((prev: any) => ({
                                                                ...prev,
                                                                materialsUsed: prev.materialsUsed.filter((_: any, i: number) => i !== idx)
                                                            }));
                                                        }}
                                                    >
                                                        <Trash2 className="h-2.5 w-2.5" />
                                                    </Button>
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3 text-red-500" /> {t("projects.issues_delays")}
                                    </label>
                                    <textarea
                                        className="w-full min-h-[80px] p-3 rounded-xl bg-background/50 border border-red-500/20 text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-muted-foreground/40 resize-none"
                                        placeholder={t("projects.issues_placeholder") || "Accidents, missing materials, weather delays..."}
                                        value={reportForm.issues}
                                        onChange={e => setReportForm({ ...reportForm, issues: e.target.value })}
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                                        {t("projects.photos") || "Photos"}
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center justify-center h-10 px-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground text-xs font-bold cursor-pointer transition-colors border border-secondary/20">
                                            <UploadIcon className="w-3 h-3 mr-2" />
                                            {reportForm.photos ? `${reportForm.photos.length} ${t("projects.files") || "files"}` : t("projects.upload_images")}
                                            <input
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                onChange={e => setReportForm({ ...reportForm, photos: e.target.files })}
                                                className="hidden"
                                            />
                                        </label>
                                    </div>
                                </div>
                                <Button className="w-full h-11 mt-2 text-sm font-bold tracking-wide shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all" onClick={handleSubmitReport} disabled={submittingReport}>
                                    {submittingReport ? <Spinner className="w-4 h-4 mr-2" /> : <SendIcon className="w-4 h-4 mr-2" />}
                                    {submittingReport ? t("projects.sending") : t("projects.submit_report")}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ATTENDANCE TAB */}
                    <TabsContent value="attendance" className="space-y-4 mt-6 animate-in">
                        <div className="flex items-center justify-between mb-4 glass p-3 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-3">
                                {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') && (
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                )}
                                <div>
                                    <h3 className="font-display font-bold text-sm tracking-tight text-foreground">
                                        {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? t("projects.live_attendance") : t("projects.attendance_records")}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? t("projects.mark_today") : t("projects.view_edit_past")}
                                    </p>
                                </div>
                            </div>
                            <Popover open={showDatePicker} onOpenChange={setShowDatePicker}>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="bg-background/50 text-xs font-black uppercase tracking-widest px-3 py-2 h-auto border-white/5 hover:bg-background/80 hover:border-primary/30 transition-all"
                                    >
                                        <CalendarIcon className="w-3.5 h-3.5 mr-2" />
                                        {format(selectedDate, 'MMM dd')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                            if (date) {
                                                setSelectedDate(date)
                                                setShowDatePicker(false)
                                            }
                                        }}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Recursive Worker Renderer Logic (Simplified for cleaner UI) */}
                        <div className="space-y-4 pb-12" style={{ contentVisibility: 'auto' } as any}>
                            {team.filter(w => !w.supervisorId).map((worker) => {
                                const isSousTraitant = worker.isSubcontractor || worker.trade === 'Sous Traitant';
                                const subWorkers = team.filter(sw => sw.supervisorId === worker._id);

                                return (
                                    <div key={worker._id}>
                                        {isSousTraitant ? (
                                            <div className="bg-card/50 rounded-lg border border-border/40 overflow-hidden mb-2">
                                                <div
                                                    className="px-3 py-2.5 flex items-center justify-between cursor-pointer hover:bg-accent/20 transition-colors"
                                                    onClick={() => setExpandedSub(expandedSub === worker._id ? null : worker._id)}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div className="h-9 w-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                                                            <UsersIcon className="w-4 h-4 text-amber-600 dark:text-amber-500" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-semibold text-sm text-foreground">{worker.name}</h4>
                                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                                <span>{t("projects.subcontractor")}</span>
                                                                <span>•</span>
                                                                <span>{subWorkers.length} {subWorkers.length !== 1 ? t("projects.members_plural") : t("projects.member")}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border-none text-xs font-semibold px-2 py-0.5">
                                                            {subWorkers.length} {t("projects.staff")}
                                                        </Badge>
                                                        {expandedSub === worker._id ?
                                                            <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        }
                                                    </div>
                                                </div>

                                                {/* Expanded Subcontractor List */}
                                                {expandedSub === worker._id && (
                                                    <div className="px-3 pb-2 pt-1 bg-accent/5 border-t border-border/30">
                                                        <div className="space-y-2">
                                                            {/* Render Subcontractor himself first */}
                                                            <div className="pt-1">
                                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("projects.team_leader")}</span>
                                                                <WorkerAttendanceItem
                                                                    worker={worker}
                                                                    status={attendanceMap[worker._id]}
                                                                    onMark={handleMarkAttendance}
                                                                    setMap={setAttendanceMap}
                                                                    isLeader
                                                                />
                                                            </div>

                                                            {subWorkers.length > 0 && (
                                                                <div className="pt-1">
                                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("projects.team_members")}</span>
                                                                    <div className="space-y-1.5">
                                                                        {subWorkers.map(sw => (
                                                                            <WorkerAttendanceItem
                                                                                key={sw._id}
                                                                                worker={sw}
                                                                                status={attendanceMap[sw._id]}
                                                                                onMark={handleMarkAttendance}
                                                                                setMap={setAttendanceMap}
                                                                            />
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <WorkerAttendanceItem
                                                worker={worker}
                                                status={attendanceMap[worker._id]}
                                                onMark={handleMarkAttendance}
                                                setMap={setAttendanceMap}
                                                className="mb-1.5"
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            {/* Modals - Reused with darker/glass styling would be ideal, but keeping functional for now */}
            {/* Add Worker Dialog */}
            {showAddWorker && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
                    <Card className="w-full max-w-sm glass-card border-white/10">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg">{t("projects.add_worker_title")}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("projects.full_name")}</label>
                                <Input
                                    placeholder="e.g. Ali Ben Ali"
                                    value={createWorkerForm.name}
                                    onChange={e => setCreateWorkerForm({ ...createWorkerForm, name: e.target.value })}
                                    className="bg-background/50 border-white/10 focus:border-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{t("projects.role_trade")}</label>
                                <div className="space-y-2">
                                    <Select
                                        value={['Ouvrier', 'Macon', 'Ferrailleur', 'Sous Traitant', 'Chef Chantier'].includes(createWorkerForm.trade) ? createWorkerForm.trade : (createWorkerForm.trade ? 'Other' : '')}
                                        onValueChange={(val) => setCreateWorkerForm({ ...createWorkerForm, trade: val === 'Other' ? '' : val })}
                                    >
                                        <SelectTrigger className="w-full bg-background/50 border-white/10 focus:ring-primary/50">
                                            <SelectValue placeholder={t("projects.select_role")} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ouvrier">Ouvrier</SelectItem>
                                            <SelectItem value="Macon">Macon</SelectItem>
                                            <SelectItem value="Ferrailleur">Ferrailleur</SelectItem>
                                            <SelectItem value="Sous Traitant">Sous Traitant</SelectItem>
                                            <SelectItem value="Chef Chantier">Chef Chantier</SelectItem>
                                            <SelectItem value="Other">{t("projects.custom_role")}</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {(!['Ouvrier', 'Macon', 'Ferrailleur', 'Sous Traitant', 'Chef Chantier'].includes(createWorkerForm.trade) && createWorkerForm.trade !== '') ||
                                        (createWorkerForm.trade === '' && !['Ouvrier', 'Macon', 'Ferrailleur', 'Sous Traitant', 'Chef Chantier'].includes(createWorkerForm.trade)) ? (
                                        // Simple logic: If it's not a standard option, show input.
                                        // Wait, checking logic:
                                        // If selected is 'Other', trade becomes '', so show Input.
                                        // If selected is 'Macon', input hidden.
                                        // Initial state '' -> Show Select placeholder. Input hidden?
                                        // Let's rely on a derived state or simple check.
                                        // If the current trade value is NOT in the list, we assume it's custom (or empty starting custom).
                                        // But we need to distinguish "Not Selected" vs "Custom".
                                        // Let's use a helper state for the UI switcher or just checking inclusion.
                                        !['Ouvrier', 'Macon', 'Ferrailleur', 'Sous Traitant', 'Chef Chantier'].includes(createWorkerForm.trade) && (
                                            <Input
                                                placeholder="Type custom role..."
                                                value={createWorkerForm.trade}
                                                onChange={e => setCreateWorkerForm({ ...createWorkerForm, trade: e.target.value })}
                                                className="bg-background/50 border-white/10 animate-in fade-in slide-in-from-top-1"
                                                autoFocus
                                            />
                                        )
                                    ) : null}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Daily Salary</label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={createWorkerForm.dailySalary}
                                        onChange={e => setCreateWorkerForm({ ...createWorkerForm, dailySalary: e.target.value })}
                                        className="bg-background/50 border-white/10 focus:border-primary/50"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</label>
                                    <Input
                                        placeholder="Optional"
                                        value={createWorkerForm.phone}
                                        onChange={e => setCreateWorkerForm({ ...createWorkerForm, phone: e.target.value })}
                                        className="bg-background/50 border-white/10 focus:border-primary/50"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 px-1 py-1">
                                <input
                                    type="checkbox"
                                    id="isSubcontractor-manager"
                                    checked={createWorkerForm.isSubcontractor}
                                    onChange={(e) => setCreateWorkerForm({ ...createWorkerForm, isSubcontractor: e.target.checked })}
                                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <Label htmlFor="isSubcontractor-manager" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider cursor-pointer">
                                    {t("projects.is_subcontractor") || "Is Subcontractor?"}
                                </Label>
                            </div>

                            {/* Supervisor Selection */}
                            {createWorkerForm.trade !== 'Sous Traitant' && subcontractors.length > 0 && (
                                <div className="space-y-2">
                                    <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Supervised By (Optional)</label>
                                    <select
                                        className="w-full p-2.5 rounded-md text-sm bg-background/50 border border-white/10 focus:border-primary/50 focus:outline-none"
                                        value={createWorkerForm.supervisorId}
                                        onChange={e => setCreateWorkerForm({ ...createWorkerForm, supervisorId: e.target.value })}
                                    >
                                        <option value="">-- Direct / No Supervisor --</option>
                                        {subcontractors.map(sub => (
                                            <option key={sub._id} value={sub._id}>{sub.name}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="flex gap-2 pt-4">
                                <Button variant="ghost" className="flex-1" onClick={() => setShowAddWorker(false)}>Cancel</Button>
                                <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={handleAddWorker}>Add Worker</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Manage Team Modal (List & Edit) */}
            {showDeleteWorkerList && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
                    <Card className="w-full max-w-sm glass-card border-white/10 max-h-[85vh] flex flex-col">
                        <CardHeader className="pb-4 border-b border-white/5">
                            <CardTitle className="text-lg">{editingWorker ? 'Edit Worker' : 'Manage Team'}</CardTitle>
                        </CardHeader>

                        <CardContent className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {editingWorker ? (
                                <div className="space-y-4 animate-in">
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Name</label>
                                        <Input
                                            value={editingWorker.name}
                                            onChange={e => setEditingWorker({ ...editingWorker, name: e.target.value })}
                                            className="bg-background/50 border-white/10"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Role</label>
                                        <Input
                                            list="trade-options-edit"
                                            value={editingWorker.trade}
                                            onChange={e => setEditingWorker({ ...editingWorker, trade: e.target.value })}
                                            className="bg-background/50 border-white/10"
                                        />
                                        <datalist id="trade-options-edit">
                                            <option value="Ouvrier" />
                                            <option value="Macon" />
                                            <option value="Ferrailleur" />
                                            <option value="Sous Traitant" />
                                        </datalist>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Salary</label>
                                            <Input
                                                type="number"
                                                value={editingWorker.dailySalary}
                                                onChange={e => setEditingWorker({ ...editingWorker, dailySalary: e.target.value })}
                                                className="bg-background/50 border-white/10"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Phone</label>
                                            <Input
                                                value={editingWorker.phone || ''}
                                                onChange={e => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                                                className="bg-background/50 border-white/10"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 px-1 py-1">
                                        <input
                                            type="checkbox"
                                            id="isSubcontractor-edit-manager"
                                            checked={editingWorker.isSubcontractor}
                                            onChange={(e) => setEditingWorker({ ...editingWorker, isSubcontractor: e.target.checked })}
                                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                                        />
                                        <Label htmlFor="isSubcontractor-edit-manager" className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider cursor-pointer">
                                            {t("projects.is_subcontractor") || "Is Subcontractor?"}
                                        </Label>
                                    </div>

                                    {/* Supervisor Selection in Edit */}
                                    {editingWorker.trade !== 'Sous Traitant' && subcontractors.length > 0 && (
                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Supervised By</label>
                                            <select
                                                className="w-full p-2.5 rounded-md text-sm bg-background/50 border border-white/10 focus:border-primary/50 focus:outline-none"
                                                value={editingWorker.supervisorId || ''}
                                                onChange={e => setEditingWorker({ ...editingWorker, supervisorId: e.target.value })}
                                            >
                                                <option value="">-- Direct / No Supervisor --</option>
                                                {subcontractors.filter(s => s._id !== editingWorker._id).map(sub => (
                                                    <option key={sub._id} value={sub._id}>{sub.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4">
                                        <Button variant="ghost" className="flex-1" onClick={() => setEditingWorker(null)}>Cancel</Button>
                                        <Button className="flex-1" onClick={handleUpdateWorker}>Save Changes</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-2" style={{ contentVisibility: 'auto' } as any}>
                                    {team.map(w => (
                                        <div key={w._id} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:border-primary/20 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                                                    {w.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-foreground">{w.name}</div>
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{w.trade}</div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1">
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg" onClick={() => setEditingWorker({ ...w, phone: w.contact?.phone })}>
                                                    {/* Pencil Icon */}
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-50 group-hover:opacity-100 transition-opacity" onClick={() => setDeleteWorkerId(w._id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    {team.length === 0 && <p className="text-center text-muted-foreground text-xs py-10">No workers in team.</p>}
                                </div>
                            )}
                        </CardContent>

                        {!editingWorker && (
                            <div className="p-4 border-t border-white/5 bg-black/20">
                                <Button className="w-full" variant="outline" onClick={() => setShowDeleteWorkerList(false)}>Close</Button>
                            </div>
                        )}
                    </Card>
                </div>
            )}


            <AlertDialog open={!!deleteWorkerId} onOpenChange={(open) => !open && setDeleteWorkerId(null)}>
                <AlertDialogContent className="rounded-2xl border-white/5 bg-background/95 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="font-display text-xl">Remove Worker?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to remove this worker from the team? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="gap-2">
                        <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteWorker} className="rounded-xl h-12 bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Out Modal */}
            {showOutModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in">
                    <Card className="w-full max-w-sm glass-card border-white/10">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-red-500" />
                                {t("projects.out_title") || "Log Material Out"}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                {project?.name}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-4">
                                {!outForm.name ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                            {t("projects.out_select_material") || "Select Material"}
                                        </label>
                                        <div className="relative">
                                            <Input
                                                placeholder={t("materials.search_placeholder") || "Rechercher..."}
                                                className="bg-background/50 border-white/10 h-11"
                                                value={classQuery}
                                                onChange={e => {
                                                    setClassQuery(e.target.value)
                                                    setShowClassSuggestions(true)
                                                }}
                                                onFocus={() => setShowClassSuggestions(true)}
                                            />
                                            {showClassSuggestions && classQuery.length > 0 && (
                                                <div className="absolute top-full left-0 right-0 z-[60] mt-1 bg-card border border-white/10 rounded-xl shadow-2xl max-h-[200px] overflow-y-auto glass">
                                                    {/* Classification Search */}
                                                    {ALL_CLASSIFICATION_NAMES.filter(n => n.toLowerCase().includes(classQuery.toLowerCase())).map(cat => (
                                                        <button
                                                            key={cat}
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 transition-colors flex justify-between items-center border-b border-white/5"
                                                            onClick={() => {
                                                                setSelectedClassification(cat)
                                                                setPickerModalType("out")
                                                                setShowClassSuggestions(false)
                                                            }}
                                                        >
                                                            <span className="font-bold">{cat}</span>
                                                            <ChevronRight className="w-4 h-4 text-muted-foreground/40" />
                                                        </button>
                                                    ))}

                                                    {/* Direct Selection from Project Materials */}
                                                    {projectMaterials.filter(m => m.name.toLowerCase().includes(classQuery.toLowerCase())).map(m => (
                                                        <button
                                                            key={m._id}
                                                            className="w-full text-left px-4 py-3 text-sm hover:bg-red-500/10 transition-colors flex justify-between items-center border-b border-white/5"
                                                            onClick={() => {
                                                                setOutForm({
                                                                    ...outForm,
                                                                    materialId: m._id,
                                                                    name: m.name,
                                                                    unit: m.unit,
                                                                    category: m.category || t("materials.general")
                                                                })
                                                                setShowClassSuggestions(false)
                                                            }}
                                                        >
                                                            <span className="font-medium">{m.name}</span>
                                                            <span className="text-[10px] text-muted-foreground font-bold uppercase">{m.stockQuantity} {m.unit}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/20">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-lg bg-red-500/10 flex items-center justify-center">
                                                    <Package className="w-5 h-5 text-red-500" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold leading-tight">{outForm.name}</p>
                                                    <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                                                        {outForm.category} • {outForm.unit}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-red-500/10" onClick={() => setOutForm({ ...outForm, name: '', materialId: '' })}>
                                                <X className="w-4 h-4 text-red-500" />
                                            </Button>
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                {t("projects.out_quantity") || "Quantity Out"}
                                            </label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                value={outForm.quantity}
                                                onChange={e => setOutForm({ ...outForm, quantity: e.target.value })}
                                                className="bg-background/50 border-white/10 focus:border-red-500/50 text-center text-xl font-bold h-14"
                                            />
                                        </div>

                                        <div className="space-y-2">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                                                {t("projects.out_notes") || "Notes (optional)"}
                                            </label>
                                            <Input
                                                placeholder="e.g. Used for foundation work"
                                                value={outForm.notes}
                                                onChange={e => setOutForm({ ...outForm, notes: e.target.value })}
                                                className="bg-background/50 border-white/10"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2 pt-2">
                                    <Button variant="ghost" className="flex-1" onClick={() => { setShowOutModal(false); setOutForm({ materialId: '', quantity: '', notes: '', name: '', unit: '', category: '' }) }}>
                                        {t("common.cancel") || "Cancel"}
                                    </Button>
                                    <Button
                                        className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold"
                                        onClick={handleRegisterOut}
                                        disabled={submittingOut || !outForm.name}
                                    >
                                        {submittingOut ? <Spinner className="w-4 h-4 mr-2" /> : null}
                                        {t("projects.out_confirm") || "CONFIRM OUT"}
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
            {/* Catalog Item Picker Overlay */}
            {selectedClassification && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in">
                    <Card className="w-full max-w-sm glass-card border-white/10 max-h-[80vh] flex flex-col">
                        <CardHeader className="p-4 border-b border-white/5 flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-sm font-bold uppercase tracking-wider text-primary">{selectedClassification}</CardTitle>
                                <p className="text-[10px] text-muted-foreground">{t("materials.select_item") || "Select Item"}</p>
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => setSelectedClassification("")}>
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-2 overflow-y-auto">
                            <div className="grid grid-cols-1 gap-1">
                                {MATERIAL_CATALOG.find(c => c.classification === selectedClassification)?.items.map(item => (
                                    <button
                                        key={item.name}
                                        className="w-full text-left p-3 rounded-lg hover:bg-primary/10 transition-colors flex justify-between items-center group border border-transparent hover:border-primary/20"
                                        onClick={() => {
                                            const data = {
                                                id: '', // New from catalog
                                                name: item.name,
                                                unit: item.unit,
                                                category: selectedClassification
                                            };

                                            if (pickerModalType === "report") {
                                                setTempMaterial({ ...tempMaterial, ...data });
                                                setMaterialSearch(item.name);
                                            } else if (pickerModalType === "out") {
                                                setOutForm({ ...outForm, ...data });
                                            } else if (pickerModalType === "usage") {
                                                setUsageForm({ ...usageForm, ...data });
                                            }

                                            setSelectedClassification("");
                                            setPickerModalType(null);
                                        }}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-semibold">{item.name}</span>
                                        </div>
                                        <Badge variant="secondary" className="text-[9px] font-bold uppercase py-0 px-1.5 bg-primary/10 text-primary border-none">
                                            {item.unit}
                                        </Badge>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}

// Component for Worker Attendance Item
function WorkerAttendanceItem({ worker, status, onMark, setMap, className, isLeader }: any) {
    const { t } = useLanguage()
    const isPresentMarked = status?.present === true
    const isAbsentMarked = status?.present === false

    return (
        <div className={`bg-card/50 rounded-lg px-3 py-2 border transition-all ${className} ${isPresentMarked
            ? 'border-green-500/30 bg-green-500/5'
            : isAbsentMarked
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-border/30 hover:border-border/50'
            }`}>
            <div className="flex items-center justify-between gap-3">
                {/* Worker Info */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <Avatar className="h-9 w-9 flex-shrink-0">
                        <AvatarFallback className="bg-primary/15 text-primary font-semibold text-xs">
                            {worker.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-sm text-foreground truncate">{worker.name}</span>
                            {isLeader && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-500 border-none font-bold flex-shrink-0">
                                    {t("projects.leader")}
                                </Badge>
                            )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{worker.trade}</div>
                    </div>
                </div>

                {/* Attendance Controls */}
                <div className="flex items-center gap-2 flex-shrink-0">
                    {/* Day Value Column */}
                    <div className="flex flex-col items-center">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">{t("projects.days")}</label>
                        <input
                            type="number"
                            step="0.5"
                            min="0"
                            max="3"
                            className="w-12 h-8 rounded-md bg-background/80 border border-border/40 text-center text-sm font-semibold focus:ring-1 focus:ring-primary/30 focus:border-primary/50 outline-none"
                            value={status?.dayValue ?? 1}
                            onChange={(e) => setMap((prev: any) => ({ ...prev, [worker._id]: { ...(prev[worker._id] || {}), dayValue: e.target.value } }))}
                            onBlur={(e) => status?.present && onMark(worker._id, true, parseFloat(e.target.value || '1'))}
                        />
                    </div>

                    {/* Presence Buttons */}
                    <button
                        className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${isPresentMarked
                            ? 'bg-green-500 text-white'
                            : 'bg-background/80 border border-border/40 text-muted-foreground hover:bg-green-500/10 hover:text-green-600 hover:border-green-500/40'
                            }`}
                        onClick={() => onMark(worker._id, true, parseFloat(String(status?.dayValue || '1')))}
                    >
                        <CheckSquare className="w-4 h-4" />
                    </button>
                    <button
                        className={`h-8 w-8 rounded-md flex items-center justify-center transition-all ${isAbsentMarked
                            ? 'bg-red-500 text-white'
                            : 'bg-background/80 border border-border/40 text-muted-foreground hover:bg-red-500/10 hover:text-red-600 hover:border-red-500/40'
                            }`}
                        onClick={() => onMark(worker._id, false, 0)}
                    >
                        <AlertCircle className="w-4 h-4" />
                    </button>
                </div>
            </div>
        </div>
    )
}

function Spinner({ className }: { className?: string }) {
    return <div className={`h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin ${className}`} />
}

function UploadIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" x2="12" y1="3" y2="15" />
        </svg>
    )
}

function SendIcon({ className }: { className?: string }) {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
        </svg>
    )
}
