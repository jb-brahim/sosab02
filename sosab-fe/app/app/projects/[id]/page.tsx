"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ChevronLeft, MapPin, Calendar, CheckSquare, Users as UsersIcon, Clock, AlertCircle, Trash2, ChevronDown, ChevronUp, HardHat, FileText, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"

export default function MobileProjectDetails() {
    const { id } = useParams()
    const router = useRouter()
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
        photos: null as FileList | null
    })
    const [submittingReport, setSubmittingReport] = useState(false)

    const [showRegisterUsage, setShowRegisterUsage] = useState(false)
    const [usageForm, setUsageForm] = useState({ materialId: '', quantity: '', notes: '' })
    const [projectMaterials, setProjectMaterials] = useState<any[]>([])
    const [expandedSub, setExpandedSub] = useState<string | null>(null)

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
        supervisorId: ''
    })

    // Derived state: Get list of Sous Traitants for dropdown
    const subcontractors = team.filter(w => w.trade === 'Sous Traitant');

    // Attendance State
    const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({})

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

    const handleMarkAttendance = async (workerId: string, present: boolean, dayValue: number = 1) => {
        try {
            // Send date as YYYY-MM-DD string to avoid timezone issues
            const today = new Date();
            const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

            await api.post('/attendance', { workerId, projectId: id, date: dateString, present, dayValue })
            toast.success(`Marked as ${present ? 'Present' : 'Absent'} (${dayValue}x)`)

            // Update local state to hide buttons immediately
            setAttendanceMap(prev => ({
                ...prev,
                [workerId]: { present, dayValue }
            }))

        } catch (error) {
            toast.error("Failed to update status")
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
            formData.append('date', new Date().toISOString())

            if (reportForm.photos) {
                Array.from(reportForm.photos).forEach(file => {
                    formData.append('photos', file)
                })
            }

            // Must set Content-Type header usually handled by axios for FormData
            await api.post('/daily-reports', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })

            toast.success("Daily Report Sent!")
            setReportForm({ workCompleted: '', issues: '', photos: null })
        } catch (error) {
            console.error(error)
            toast.error("Failed to send report")
        } finally {
            setSubmittingReport(false)
        }
    }


    const handleRegisterUsage = async () => {
        if (!usageForm.materialId || !usageForm.quantity) return toast.error("Please fill all fields")
        try {
            await api.post('/materials/log', {
                materialId: usageForm.materialId,
                type: 'OUT',
                quantity: usageForm.quantity,
                notes: usageForm.notes
            })
            toast.success("Usage Registered!")
            setShowRegisterUsage(false)
            setUsageForm({ materialId: '', quantity: '', notes: '' })

            // Refresh
            const logsRes = await api.get(`/materials/projects/${id}/logs`)
            if (logsRes.data.success) setMaterialLogs(logsRes.data.data)
            const matRes = await api.get(`/materials/${id}`)
            if (matRes.data.success) setProjectMaterials(matRes.data.data)
        } catch (error) {
            toast.error("Failed to register usage")
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
                supervisorId: createWorkerForm.supervisorId || null
            })

            toast.success("Worker Created & Added!")
            setShowAddWorker(false)
            setCreateWorkerForm({ name: '', trade: '', phone: '', dailySalary: '', supervisorId: '' })

            // Refresh team list
            const teamRes = await api.get(`/projects/${id}/team`)
            if (teamRes.data.success) setTeam(teamRes.data.data)

        } catch (error) {
            console.error(error)
            toast.error("Failed to create worker")
        }
    }

    const handleDeleteWorker = async (workerId: string) => {
        if (!confirm("Are you sure you want to remove this worker? This cannot be undone.")) return

        try {
            await api.delete(`/workers/${workerId}`)
            toast.success("Worker Removed")

            // Remove from local state immediately
            setTeam(prev => prev.filter(w => w._id !== workerId))
        } catch (error) {
            console.error("Failed to delete worker", error)
            toast.error("Failed to delete worker")
        }
    }

    const handleUpdateWorker = async () => {
        if (!editingWorker || !editingWorker._id) return
        if (!editingWorker.name) return toast.error("Name is required")
        if (!editingWorker.trade) return toast.error("Role (Trade) is required")
        if (!editingWorker.dailySalary) return toast.error("Salary is required")

        try {
            await api.put(`/workers/${editingWorker._id}`, {
                name: editingWorker.name,
                trade: editingWorker.trade,
                dailySalary: Number(editingWorker.dailySalary),
                contact: { phone: editingWorker.phone },
                supervisorId: editingWorker.supervisorId || null
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
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Loading Project...</p>
            </div>
        </div>
    )
    if (!project) return null

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-20">
            {/* Decorative Background Elements - matching dashboard */}
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/5 bg-background/60 p-4 backdrop-blur-xl transition-all">
                <Button variant="ghost" size="icon" onClick={() => router.push("/app")} className="hover:bg-primary/20 hover:text-primary rounded-xl">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-lg font-display font-bold tracking-tight">{project.name}</h1>
                </div>
                <Badge
                    className={`ml-auto border border-white/10 ${project.status === 'Active' ? 'bg-primary/20 text-primary hover:bg-primary/30' : 'bg-muted text-muted-foreground'}`}
                >
                    {project.status}
                </Badge>
            </div>

            <div className="p-4 relative z-10">
                <Tabs defaultValue={activeTab} onValueChange={(val) => router.replace(`/app/projects/${id}?tab=${val}`, { scroll: false })} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-card/40 backdrop-blur-md border border-white/5 p-1 rounded-xl h-auto">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium text-xs py-2 data-[state=active]:shadow-none focus:ring-0">Overview</TabsTrigger>
                        <TabsTrigger value="report" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium text-xs py-2 data-[state=active]:shadow-none focus:ring-0">Report</TabsTrigger>
                        <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium text-xs py-2 data-[state=active]:shadow-none focus:ring-0">Attendance</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-4 mt-6 animate-in">

                        {/* Status Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center group">
                                <UsersIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                                <span className="text-2xl font-display font-bold">{team.length}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">On Site</span>
                            </div>
                            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center group">
                                <Clock className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                                <span className="text-xs font-display font-bold mt-2">{materialLogs.length} logs</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">Activity</span>
                            </div>
                        </div>

                        {/* Inventory Card */}
                        <div className="glass-card rounded-2xl p-0 overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Materials Log</h3>
                                </div>
                                <Button size="sm" variant="outline" className="h-7 text-xs border-primary/20 hover:bg-primary/10 text-primary" onClick={() => router.push(`/app/scan?projectId=${id}&type=in`)}>
                                    + Arrival
                                </Button>
                            </div>
                            <div className="p-0">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                    {materialLogs.length === 0 ? (
                                        <div className="p-6 text-center text-muted-foreground text-xs">No recent activity.</div>
                                    ) : (
                                        materialLogs.map((log: any, i) => (
                                            <div key={log._id} className={`flex items-center justify-between p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${i % 2 === 0 ? 'bg-transparent' : 'bg-black/20'}`}>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-sm">{log.materialId?.name || 'Material'}</span>
                                                    <span className="text-[10px] text-muted-foreground">{format(new Date(log.createdAt), 'MMM dd, HH:mm')}</span>
                                                </div>
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${log.type === 'IN' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                                                    {log.type === 'IN' ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                                                    {log.quantity} {log.materialId?.unit || log.unit}
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
                                    <HardHat className="w-4 h-4 text-primary" /> Team
                                </h3>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-7 text-xs text-muted-foreground hover:text-foreground" onClick={() => setShowDeleteWorkerList(true)}>Members</Button>
                                    <Button size="sm" className="h-7 text-xs bg-primary/20 text-primary hover:bg-primary/30 border border-primary/20 shadow-none" onClick={() => setShowAddWorker(true)}>+ Add</Button>
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
                                <span className="text-xs text-muted-foreground font-medium">{team.length > 0 ? 'Active Crew' : 'No Crew'}</span>
                            </div>
                        </div>

                        {/* Details Card */}
                        <div className="glass-card rounded-2xl p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> Location
                            </h3>
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium mb-1">{project.location}</p>
                            <p className="text-xs text-muted-foreground">{project.description}</p>
                        </div>

                    </TabsContent>


                    {/* REPORT PROBLEM TAB */}
                    <TabsContent value="report" className="space-y-4 mt-6 animate-in">
                        <div className="glass-card rounded-2xl p-5 border-l-4 border-l-primary/50">
                            <div className="mb-4">
                                <h3 className="font-display text-lg font-bold">Daily Report</h3>
                                <p className="text-xs text-muted-foreground">Submit daily progress or report site issues.</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <CheckSquare className="w-3 h-3 text-green-500" /> Work Completed
                                    </label>
                                    <textarea
                                        className="w-full min-h-[100px] p-3 rounded-xl bg-background/50 border border-border/50 text-sm focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-muted-foreground/40 resize-none"
                                        placeholder="Detailed summary of work done today..."
                                        value={reportForm.workCompleted}
                                        onChange={e => setReportForm({ ...reportForm, workCompleted: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                                        <AlertCircle className="w-3 h-3 text-red-500" /> Issues / Delays
                                    </label>
                                    <textarea
                                        className="w-full min-h-[80px] p-3 rounded-xl bg-background/50 border border-red-500/20 text-sm focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all placeholder:text-muted-foreground/40 resize-none"
                                        placeholder="Accidents, missing materials, weather delays..."
                                        value={reportForm.issues}
                                        onChange={e => setReportForm({ ...reportForm, issues: e.target.value })}
                                    />
                                </div>
                                <div className="pt-2">
                                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                                        Photos
                                    </label>
                                    <div className="flex items-center gap-2">
                                        <label className="flex items-center justify-center h-10 px-4 rounded-lg bg-secondary/20 hover:bg-secondary/30 text-secondary-foreground text-xs font-bold cursor-pointer transition-colors border border-secondary/20">
                                            <UploadIcon className="w-3 h-3 mr-2" />
                                            {reportForm.photos ? `${reportForm.photos.length} files` : 'Upload Images'}
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
                                    {submittingReport ? 'Sending...' : 'SUBMIT REPORT'}
                                </Button>
                            </div>
                        </div>
                    </TabsContent>

                    {/* ATTENDANCE TAB */}
                    <TabsContent value="attendance" className="space-y-4 mt-6 animate-in">
                        <div className="flex items-center justify-between mb-4 glass p-3 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-3">
                                <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <div>
                                    <h3 className="font-display font-bold text-sm tracking-tight text-foreground">Live Attendance</h3>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Mark today's presence</p>
                                </div>
                            </div>
                            <Badge variant="outline" className="bg-background/50 text-[10px] font-black uppercase tracking-widest px-2 py-1 border-white/5">
                                {format(new Date(), 'MMM dd')}
                            </Badge>
                        </div>

                        {/* Recursive Worker Renderer Logic (Simplified for cleaner UI) */}
                        <div className="space-y-4 pb-12">
                            {team.filter(w => !w.supervisorId).map((worker) => {
                                const isSousTraitant = worker.trade === 'Sous Traitant';
                                const subWorkers = team.filter(sw => sw.supervisorId === worker._id);

                                return (
                                    <div key={worker._id}>
                                        {isSousTraitant ? (
                                            <div className="glass-card rounded-2xl p-0 overflow-hidden mb-3">
                                                <div
                                                    className="p-4 flex items-center justify-between cursor-pointer bg-white/5 hover:bg-white/10 transition-colors"
                                                    onClick={() => setExpandedSub(expandedSub === worker._id ? null : worker._id)}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-orange-500/20 text-orange-500 flex items-center justify-center border border-orange-500/20">
                                                            <UsersIcon className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-sm">{worker.name}</h4>
                                                            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider block mt-0.5">Sub-Contractor</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge className="bg-orange-500/10 text-orange-500 border-none">{subWorkers.length} Staff</Badge>
                                                        {expandedSub === worker._id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                                    </div>
                                                </div>

                                                {/* Expanded Subcontractor List */}
                                                {expandedSub === worker._id && (
                                                    <div className="p-3 bg-black/20 border-t border-white/5 space-y-3">
                                                        {/* Render Subcontractor himself first */}
                                                        <WorkerAttendanceItem
                                                            worker={worker}
                                                            status={attendanceMap[worker._id]}
                                                            onMark={handleMarkAttendance}
                                                            setMap={setAttendanceMap}
                                                            isLeader
                                                        />
                                                        <div className="pl-4 border-l-2 border-white/10 space-y-3 pt-1">
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
                                        ) : (
                                            <WorkerAttendanceItem
                                                worker={worker}
                                                status={attendanceMap[worker._id]}
                                                onMark={handleMarkAttendance}
                                                setMap={setAttendanceMap}
                                                className="mb-3"
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
                            <CardTitle className="text-lg">Add Worker</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Full Name</label>
                                <Input
                                    placeholder="e.g. Ali Ben Ali"
                                    value={createWorkerForm.name}
                                    onChange={e => setCreateWorkerForm({ ...createWorkerForm, name: e.target.value })}
                                    className="bg-background/50 border-white/10 focus:border-primary/50"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Role / Trade</label>
                                <div className="space-y-2">
                                    <Select
                                        value={['Ouvrier', 'Macon', 'Ferrailleur', 'Sous Traitant', 'Chef Chantier'].includes(createWorkerForm.trade) ? createWorkerForm.trade : (createWorkerForm.trade ? 'Other' : '')}
                                        onValueChange={(val) => setCreateWorkerForm({ ...createWorkerForm, trade: val === 'Other' ? '' : val })}
                                    >
                                        <SelectTrigger className="w-full bg-background/50 border-white/10 focus:ring-primary/50">
                                            <SelectValue placeholder="Select Role" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Ouvrier">Ouvrier</SelectItem>
                                            <SelectItem value="Macon">Macon</SelectItem>
                                            <SelectItem value="Ferrailleur">Ferrailleur</SelectItem>
                                            <SelectItem value="Sous Traitant">Sous Traitant</SelectItem>
                                            <SelectItem value="Chef Chantier">Chef Chantier</SelectItem>
                                            <SelectItem value="Other">Other (Type Custom)</SelectItem>
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
                                <div className="space-y-2">
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
                                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-lg opacity-50 group-hover:opacity-100 transition-opacity" onClick={() => handleDeleteWorker(w._id)}>
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

        </div>
    )
}

// Component for Worker Attendance Item
function WorkerAttendanceItem({ worker, status, onMark, setMap, className, isLeader }: any) {
    return (
        <div className={`glass-card p-3 rounded-xl flex items-center justify-between border border-white/5 ${className} ${status?.present === true ? 'bg-green-500/5 border-green-500/20' : status?.present === false ? 'bg-red-500/5 border-red-500/20' : ''}`}>
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-white/10">
                    <AvatarFallback className="bg-primary/20 text-primary font-bold text-xs">
                        {worker.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <div className="font-bold text-sm flex items-center gap-2">
                        {worker.name}
                        {isLeader && <Badge className="text-[9px] h-4 px-1 bg-primary/20 text-primary border-none">LEADER</Badge>}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">{worker.trade}</div>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <input
                    type="number" step="0.5" min="0" max="3"
                    className="w-10 h-8 rounded-lg bg-black/20 border border-white/10 text-center text-xs font-bold focus:ring-1 focus:ring-primary/50 outline-none"
                    value={status?.dayValue ?? 1}
                    onChange={(e) => setMap((prev: any) => ({ ...prev, [worker._id]: { ...(prev[worker._id] || {}), dayValue: e.target.value } }))}
                    onBlur={(e) => status?.present && onMark(worker._id, true, parseFloat(e.target.value || '1'))}
                />
                <div className="flex bg-black/20 rounded-lg p-0.5 border border-white/10">
                    <button
                        className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${status?.present === true ? 'bg-green-500 text-white shadow-lg shadow-green-500/20' : 'text-muted-foreground hover:bg-white/5'}`}
                        onClick={() => onMark(worker._id, true, parseFloat(String(status?.dayValue || '1')))}
                    >
                        <CheckSquare className="w-4 h-4" />
                    </button>
                    <button
                        className={`h-7 w-7 rounded-md flex items-center justify-center transition-all ${status?.present === false ? 'bg-red-500 text-white shadow-lg shadow-red-500/20' : 'text-muted-foreground hover:bg-white/5'}`}
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
