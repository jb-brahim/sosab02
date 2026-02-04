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
import { ChevronLeft, MapPin, Calendar, CheckSquare, Users as UsersIcon, Clock, AlertCircle, Trash2, ChevronDown, ChevronUp } from "lucide-react"
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

    // Load available workers for "Add Worker" dropdown
    useEffect(() => {
        // ... kept previous logic if needed, but we switched to Create Form. 
        // We can leave this or blank it out if we removed list usage.
        // For safety I'll leave it but the UI doesn't use it anymore.
    }, [showAddWorker, team])

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

    if (loading) return <div className="p-8 text-center">Loading Project...</div>
    if (!project) return null

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b border-border/50 bg-background/80 p-4 backdrop-blur-md">
                <Button variant="ghost" size="icon" onClick={() => router.push("/app")}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-lg font-bold">{project.name}</h1>
                </div>
                <Badge className="ml-auto" variant={project.status === 'Active' ? 'default' : 'secondary'}>{project.status}</Badge>
            </div>

            <div className="p-4">
                <Tabs defaultValue={activeTab} onValueChange={(val) => router.replace(`/app/projects/${id}?tab=${val}`, { scroll: false })} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="overview">Overv.</TabsTrigger>
                        <TabsTrigger value="report">Report</TabsTrigger>
                        <TabsTrigger value="attendance">Attend.</TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW TAB */}
                    <TabsContent value="overview" className="space-y-4 mt-4">
                        {/* Material Status Card */}
                        <Card>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Materials Activity</CardTitle>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-600 h-8 px-2" onClick={() => setShowRegisterUsage(true)}>
                                        - Use
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => router.push(`/app/scan?projectId=${id}&type=in`)}>+ Arrival</Button>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-2">

                                <div className="flex justify-between text-sm border-b pb-2 pt-4">
                                    <span className="text-muted-foreground">Recent Movements</span>
                                </div>
                                <div className="max-h-32 overflow-y-auto space-y-2">
                                    {materialLogs.map((log: any) => (
                                        <div key={log._id} className="flex justify-between text-xs">
                                            <span>{log.materialId?.name || 'Material'}</span>
                                            <span className={log.type === 'IN' ? 'text-green-600 font-bold' : 'text-red-600 font-bold'}>
                                                {log.type === 'IN' ? '+' : '-'}{log.quantity} {log.materialId?.unit || log.unit || 'pcs'}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Team Management Card */}
                        <Card>
                            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                <CardTitle className="text-sm font-medium">Team Management</CardTitle>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="ghost" className="h-8 px-2 text-muted-foreground" onClick={() => setShowDeleteWorkerList(true)}>
                                        See All
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={() => setShowAddWorker(true)}>+ Add Worker</Button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="text-sm text-muted-foreground">
                                    {team.length} active workers on site.
                                </div>
                            </CardContent>
                        </Card>
                        {/* Details Card */}
                        <Card>
                            <CardHeader><CardTitle className="text-base">Project Details</CardTitle></CardHeader>
                            <CardContent className="text-sm space-y-2">
                                <div><MapPin className="inline w-3 h-3 mr-1" /> {project.location}</div>
                                <div className="text-muted-foreground">{project.description}</div>
                            </CardContent>
                        </Card>
                    </TabsContent>


                    {/* REPORT PROBLEM TAB (Replaces Team) */}
                    <TabsContent value="report" className="space-y-4 mt-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Daily Report / Issue</CardTitle>
                                <CardDescription>Send an update or report a problem to Admin.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <label className="text-xs font-medium mb-1 block">Work Completed Today</label>
                                    <textarea
                                        className="w-full min-h-[80px] p-2 rounded-md border text-sm"
                                        placeholder="What did the team finish..."
                                        value={reportForm.workCompleted}
                                        onChange={e => setReportForm({ ...reportForm, workCompleted: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block text-red-500">Problems / Issues</label>
                                    <textarea
                                        className="w-full min-h-[80px] p-2 rounded-md border text-sm border-red-200"
                                        placeholder="Any delays, accidents, or missing items..."
                                        value={reportForm.issues}
                                        onChange={e => setReportForm({ ...reportForm, issues: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-medium mb-1 block">Attach Photo</label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={e => setReportForm({ ...reportForm, photos: e.target.files })}
                                        className="text-sm text-muted-foreground"
                                    />
                                </div>
                                <Button className="w-full" onClick={handleSubmitReport} disabled={submittingReport}>
                                    {submittingReport ? 'Sending...' : 'Submit Report'}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* HELPER FOR ATTENDANCE ROW */}
                    {(() => {
                        const renderWorkerAttendanceRow = (worker: any, isNested: boolean = false) => {
                            const status = attendanceMap[worker._id];
                            return (
                                <div key={worker._id} className="relative">
                                    {isNested && (
                                        <div className="absolute left-3 top-0 bottom-0 w-[1.5px] bg-slate-200/50 -translate-x-1" />
                                    )}
                                    <div className={`flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 ${isNested ? 'ml-6 bg-background/40 border-dashed mb-2' : 'bg-card border-border mb-3 shadow-md'
                                        } ${status?.present === true ? 'ring-1 ring-emerald-500/20' : status?.present === false ? 'ring-1 ring-rose-500/20' : ''}`}>

                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                <Avatar className="h-10 w-10 border-2 border-background shadow-sm ring-1 ring-border/50">
                                                    <AvatarFallback className="bg-muted text-muted-foreground font-black text-[10px] uppercase">
                                                        {worker.name.charAt(0)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                {status?.present !== undefined && (
                                                    <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center shadow-sm ${status.present ? 'bg-emerald-500' : 'bg-rose-500'}`}>
                                                        {status.present ? <CheckSquare className="w-2.5 h-2.5 text-white" /> : <AlertCircle className="w-2.5 h-2.5 text-white" />}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <div className="font-extrabold text-sm text-foreground tracking-tight leading-none">{worker.name}</div>
                                                <div className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-1">{worker.trade || 'Worker'}</div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            <div className="relative">
                                                <input
                                                    type="number" min="0" max="3" step="0.1"
                                                    className="h-8 w-12 text-center font-black text-xs bg-muted/20 border border-border/40 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all font-sans"
                                                    value={status?.dayValue ?? 1}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setAttendanceMap(prev => ({
                                                            ...prev,
                                                            [worker._id]: { ...(prev[worker._id] || {}), dayValue: val }
                                                        }))
                                                    }}
                                                    onBlur={(e) => {
                                                        if (status?.present) {
                                                            handleMarkAttendance(worker._id, true, parseFloat(e.target.value || '1'))
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="flex bg-muted/20 p-1 rounded-xl gap-1 border border-border/10">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`h-8 w-8 p-0 rounded-lg transition-all ${status?.present === true
                                                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                                                        : 'hover:bg-emerald-50 text-emerald-600'
                                                        }`}
                                                    onClick={() => handleMarkAttendance(worker._id, true, parseFloat(String(status?.dayValue || '1')))}
                                                >
                                                    <CheckSquare className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className={`h-8 w-8 p-0 rounded-lg transition-all ${status?.present === false
                                                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20'
                                                        : 'hover:bg-rose-50 text-rose-600'
                                                        }`}
                                                    onClick={() => handleMarkAttendance(worker._id, false, 0)}
                                                >
                                                    <AlertCircle className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        };
                        return (
                            <TabsContent value="attendance" className="space-y-4 mt-6">
                                <div className="flex items-center justify-between mb-4 bg-muted/20 p-3 rounded-2xl border border-border/30">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                        <h3 className="font-black text-xs uppercase tracking-widest text-foreground">Live Attendance</h3>
                                    </div>
                                    <span className="text-[10px] font-black uppercase text-muted-foreground bg-background px-2 py-1 rounded-lg border shadow-sm">{format(new Date(), 'EEEE, MMM dd')}</span>
                                </div>

                                <div className="space-y-4">
                                    {team.filter(w => !w.supervisorId).map((worker) => {
                                        const isSousTraitant = worker.trade === 'Sous Traitant';
                                        const isExpanded = expandedSub === worker._id;
                                        const subWorkers = team.filter(sw => sw.supervisorId === worker._id);

                                        if (isSousTraitant) {
                                            return (
                                                <div key={worker._id} className="space-y-2">
                                                    <Button
                                                        variant="ghost"
                                                        className={`w-full flex justify-between items-center p-4 h-auto rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-accent/50 border-accent shadow-none' : 'bg-card border-border/50 hover:bg-accent/50'}`}
                                                        onClick={() => setExpandedSub(isExpanded ? null : worker._id)}
                                                    >
                                                        <div className="flex items-center gap-4">
                                                            <div className={`p-3 rounded-2xl shadow-inner transition-colors ${isExpanded ? 'bg-background/80' : 'bg-muted'}`}>
                                                                <UsersIcon className={`w-5 h-5 ${isExpanded ? 'text-primary' : 'text-muted-foreground'}`} />
                                                            </div>
                                                            <div className="text-left">
                                                                <div className="font-black text-sm tracking-tight text-foreground">{worker.name}</div>
                                                                <div className={`text-[10px] font-black uppercase tracking-[0.15em] flex gap-2 items-center mt-0.5 ${isExpanded ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                                    <span>SOUS TRAITANT</span>
                                                                    <span className="opacity-30">•</span>
                                                                    <span>{subWorkers.length} Workers</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className={`p-1 rounded-lg transition-colors ${isExpanded ? 'bg-background/50' : 'bg-muted/50'}`}>
                                                            {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground/50" />}
                                                        </div>
                                                    </Button>
                                                    {isExpanded && (
                                                        <div className="space-y-2 pt-2 pb-4 px-1 ml-4 border-l-[3px] border-border pl-4 rounded-bl-3xl">
                                                            <div className="flex items-center gap-2 mb-3">
                                                                <div className="h-[1px] w-4 bg-border" />
                                                                <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Section Leader</div>
                                                            </div>
                                                            {renderWorkerAttendanceRow(worker)}

                                                            {subWorkers.length > 0 && (
                                                                <>
                                                                    <div className="flex items-center gap-2 mt-6 mb-3">
                                                                        <div className="h-[1px] w-4 bg-border" />
                                                                        <div className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Managed Personnel</div>
                                                                    </div>
                                                                    {subWorkers.map(sw => renderWorkerAttendanceRow(sw, true))}
                                                                </>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        }

                                        return renderWorkerAttendanceRow(worker);
                                    })}
                                </div>
                            </TabsContent>
                        );
                    })()}
                </Tabs>
            </div>


            {/* Add Worker Dialog */}
            {
                showAddWorker ? (
                    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                        <Card className="w-full max-w-sm">
                            <CardHeader>
                                <CardTitle>Add Worker</CardTitle>
                                <CardDescription>Select a worker to assign to this project.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium">Full Name</label>
                                        <input
                                            className="w-full p-2 border rounded-md text-sm"
                                            placeholder="Worker Name"
                                            value={createWorkerForm.name}
                                            onChange={e => setCreateWorkerForm({ ...createWorkerForm, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium">Trade / Role</label>
                                        <input
                                            list="trade-options"
                                            className="w-full p-2 border rounded-md text-sm bg-background"
                                            value={createWorkerForm.trade}
                                            onChange={e => setCreateWorkerForm({ ...createWorkerForm, trade: e.target.value })}
                                            placeholder="Select or type..."
                                        />
                                        <datalist id="trade-options">
                                            <option value="Ouvrier" />
                                            <option value="Macon" />
                                            <option value="Ferrailleur" />
                                            <option value="Sous Traitant" />
                                            <option value="Chef Chantier" />
                                        </datalist>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-medium">Daily Salary (TND)</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 border rounded-md text-sm"
                                                placeholder="0.00"
                                                value={createWorkerForm.dailySalary}
                                                onChange={e => setCreateWorkerForm({ ...createWorkerForm, dailySalary: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium">Phone</label>
                                            <input
                                                className="w-full p-2 border rounded-md text-sm"
                                                placeholder="22 333 444"
                                                value={createWorkerForm.phone}
                                                onChange={e => setCreateWorkerForm({ ...createWorkerForm, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {/* Subcontractor Selection (Only if not creating a Sous Traitant) */}
                                    {createWorkerForm.trade !== 'Sous Traitant' && subcontractors.length > 0 && (
                                        <div>
                                            <label className="text-xs font-medium">Supervised by (Sous Traitant)</label>
                                            <select
                                                className="w-full p-2 border rounded-md text-sm bg-background"
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
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button variant="outline" onClick={() => setShowAddWorker(false)}>Cancel</Button>
                                    <Button onClick={handleAddWorker}>{isAddingWorker ? 'Adding...' : 'Add Worker'}</Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : null
            }

            {/* Manage Team Dialog (See All / Edit / Delete) */}
            {showDeleteWorkerList ? (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm max-h-[85vh] flex flex-col">
                        <CardHeader>
                            <CardTitle>{editingWorker ? 'Edit Worker' : 'Manage Team'}</CardTitle>
                            <CardDescription>
                                {editingWorker ? 'Update worker details.' : 'View, edit, or remove workers.'}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 overflow-y-auto space-y-2">
                            {editingWorker ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="text-xs font-medium">Full Name</label>
                                        <input
                                            className="w-full p-2 border rounded-md text-sm"
                                            value={editingWorker.name}
                                            onChange={e => setEditingWorker({ ...editingWorker, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium">Trade / Role</label>
                                        <input
                                            list="trade-options"
                                            className="w-full p-2 border rounded-md text-sm bg-background"
                                            value={editingWorker.trade || ''}
                                            onChange={e => setEditingWorker({ ...editingWorker, trade: e.target.value })}
                                            placeholder="Select or type..."
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <label className="text-xs font-medium">Daily Salary</label>
                                            <input
                                                type="number"
                                                className="w-full p-2 border rounded-md text-sm"
                                                value={editingWorker.dailySalary}
                                                onChange={e => setEditingWorker({ ...editingWorker, dailySalary: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-medium">Phone</label>
                                            <input
                                                className="w-full p-2 border rounded-md text-sm"
                                                value={editingWorker.phone || ''}
                                                onChange={e => setEditingWorker({ ...editingWorker, phone: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    {/* Edit Subcontractor Assignment */}
                                    {editingWorker.trade !== 'Sous Traitant' && subcontractors.length > 0 && (
                                        <div>
                                            <label className="text-xs font-medium">Supervised by (Sous Traitant)</label>
                                            <select
                                                className="w-full p-2 border rounded-md text-sm bg-background"
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
                                    <div className="flex gap-2 justify-end pt-4">
                                        <Button variant="ghost" size="sm" onClick={() => setEditingWorker(null)}>Cancel</Button>
                                        <Button size="sm" onClick={handleUpdateWorker}>Save Changes</Button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {team.length === 0 ? (
                                        <p className="text-sm text-center text-muted-foreground py-4">No workers found.</p>
                                    ) : (
                                        team.map(worker => (
                                            <div key={worker._id} className="flex items-center justify-between p-3 border rounded-md bg-card">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center font-bold text-xs">
                                                        {worker.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="text-sm font-medium">{worker.name}</div>
                                                        <div className="text-xs text-muted-foreground">
                                                            {worker.trade} • {worker.dailySalary ? `${worker.dailySalary} TND` : '-'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => setEditingWorker({ ...worker, phone: worker.contact?.phone })}
                                                    >
                                                        <CheckSquare className="w-4 h-4 text-blue-500" /> {/* Reusing CheckSquare icon as Edit icon to avoid adding new import immediately, or logic: prefer Edit Icon if available, else generic */}
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                                                        onClick={() => handleDeleteWorker(worker._id)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </>
                            )}
                        </CardContent>
                        {!editingWorker && (
                            <div className="p-4 border-t">
                                <Button variant="outline" className="w-full" onClick={() => setShowDeleteWorkerList(false)}>Close</Button>
                            </div>
                        )}
                    </Card>
                </div>
            ) : null}
            {/* Register Usage Dialog */}
            {showRegisterUsage && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <Card className="w-full max-w-sm">
                        <CardHeader>
                            <CardTitle>Register Usage</CardTitle>
                            <CardDescription>Log materials used on site (Decreases stock).</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Select Material</label>
                                <select
                                    className="w-full p-2 border rounded-md text-sm bg-background"
                                    value={usageForm.materialId}
                                    onChange={e => setUsageForm({ ...usageForm, materialId: e.target.value })}
                                >
                                    <option value="">-- Choose Item --</option>
                                    {projectMaterials.map((m: any) => (
                                        <option key={m._id} value={m._id}>
                                            {m.name} (Stock: {m.stockQuantity} {m.unit})
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Quantity Used</label>
                                <input
                                    type="number"
                                    className="w-full p-2 border rounded-md text-sm"
                                    placeholder="Amount"
                                    value={usageForm.quantity}
                                    onChange={e => setUsageForm({ ...usageForm, quantity: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium">Notes / Purpose</label>
                                <input
                                    className="w-full p-2 border rounded-md text-sm"
                                    placeholder="e.g. Columns for Floor 1"
                                    value={usageForm.notes}
                                    onChange={e => setUsageForm({ ...usageForm, notes: e.target.value })}
                                />
                            </div>
                            <div className="flex gap-2 justify-end pt-2">
                                <Button variant="outline" onClick={() => setShowRegisterUsage(false)}>Cancel</Button>
                                <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleRegisterUsage}>Confirm Usage</Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
