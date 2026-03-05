"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ChevronLeft, MapPin, Calendar as CalendarIcon, Users as UsersIcon, Clock, ChevronDown, ChevronUp, HardHat, FileText, ArrowUpRight, ArrowDownLeft, CheckSquare, AlertCircle } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLanguage } from "@/lib/language-context"

export default function GerantProjectDetails() {
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

    const [expandedSub, setExpandedSub] = useState<string | null>(null)

    // Attendance State
    const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({})
    const [selectedDate, setSelectedDate] = useState<Date>(new Date())
    const [showDatePicker, setShowDatePicker] = useState(false)

    useEffect(() => {
        const fetchProjectData = async () => {
            try {
                setLoading(true)
                const todayStr = format(new Date(), 'yyyy-MM-dd')
                const [projectRes, teamRes, logsRes, attRes] = await Promise.all([
                    api.get(`/projects/${id}`),
                    api.get(`/projects/${id}/team`),
                    api.get(`/materials/projects/${id}/logs`),
                    api.get(`/attendance/project/${id}/date/${todayStr}`)
                ])

                if (projectRes.data.success) setProject(projectRes.data.data)
                if (teamRes.data.success) setTeam(teamRes.data.data)
                if (logsRes.data.success) setMaterialLogs(logsRes.data.data)

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
                    setAttendanceMap({})
                }
            } catch (error) {
                console.error("Failed to fetch attendance", error)
                setAttendanceMap({})
            }
        }
        fetchAttendance()
    }, [id, selectedDate])

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
            <div className="absolute top-0 left-0 w-full h-80 bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />

            <div className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/5 bg-background/80 p-4 backdrop-blur-md transition-all">
                <Button variant="ghost" size="icon" onClick={() => router.push("/gerant")} className="hover:bg-primary/20 hover:text-primary rounded-xl">
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <div>
                    <h1 className="text-lg font-display font-bold tracking-tight">{project.name}</h1>
                </div>
            </div>

            <div className="p-4 relative z-10">
                <Tabs defaultValue={activeTab} onValueChange={(val) => router.replace(`/gerant/projects/${id}?tab=${val}`, { scroll: false })} className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-card/40 backdrop-blur-md border border-white/5 p-1 rounded-xl h-auto">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium text-sm py-2 data-[state=active]:shadow-none focus:ring-0">{t("projects.overview") || "Overview"}</TabsTrigger>
                        <TabsTrigger value="attendance" className="rounded-lg data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium text-sm py-2 data-[state=active]:shadow-none focus:ring-0">{t("projects.attendance") || "Attendance"}</TabsTrigger>
                    </TabsList>

                    <TabsContent value="overview" className="space-y-4 mt-6 animate-in">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center group">
                                <UsersIcon className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                                <span className="text-2xl font-display font-bold">{team.length}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("projects.on_site") || "On Site"}</span>
                            </div>
                            <div className="glass-card rounded-xl p-4 flex flex-col items-center justify-center gap-1 text-center group">
                                <Clock className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors mb-1" />
                                <span className="text-xs font-display font-bold mt-2">{materialLogs.length} {t("projects.activity") || "activities"}</span>
                                <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">{t("projects.activity_label") || "Activity Logs"}</span>
                            </div>
                        </div>

                        <div className="glass-card rounded-2xl p-0 overflow-hidden">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-primary/5">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-primary" />
                                    <h3 className="text-sm font-bold uppercase tracking-wider">Materials Log</h3>
                                </div>
                            </div>
                            <div className="p-0">
                                <div className="max-h-48 overflow-y-auto custom-scrollbar gpu" style={{ contentVisibility: 'auto' } as any}>
                                    {materialLogs.length === 0 ? (
                                        <div className="p-6 text-center text-muted-foreground text-xs">{t("projects.no_recent_activity") || "No activity"}</div>
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

                        <div className="glass-card rounded-2xl p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <HardHat className="w-4 h-4 text-primary" /> {t("projects.team") || "Team"}
                                </h3>
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

                        <div className="glass-card rounded-2xl p-5">
                            <h3 className="text-sm font-bold uppercase tracking-wider mb-3 flex items-center gap-2">
                                <MapPin className="w-4 h-4 text-primary" /> {t("projects.location_label") || "Location"}
                            </h3>
                            <p className="text-sm text-foreground/80 leading-relaxed font-medium mb-1">{project.location}</p>
                            <p className="text-xs text-muted-foreground">{project.description}</p>
                        </div>
                    </TabsContent>

                    <TabsContent value="attendance" className="space-y-4 mt-6 animate-in">
                        <div className="flex items-center justify-between mb-4 glass p-3 rounded-2xl border border-primary/10">
                            <div className="flex items-center gap-3">
                                <div>
                                    <h3 className="font-display font-bold text-sm tracking-tight text-foreground">
                                        {format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd') ? t("projects.live_attendance") : t("projects.attendance_records")}
                                    </h3>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                                        View Date
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
                                                                <span>{t("projects.subcontractor") || "Subcontractor"}</span>
                                                                <span>•</span>
                                                                <span>{subWorkers.length} {subWorkers.length !== 1 ? t("projects.members_plural") : t("projects.member")}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 dark:text-amber-500 border-none text-xs font-semibold px-2 py-0.5">
                                                            {subWorkers.length} {t("projects.staff") || "Staff"}
                                                        </Badge>
                                                        {expandedSub === worker._id ?
                                                            <ChevronUp className="w-4 h-4 text-muted-foreground" /> :
                                                            <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                                        }
                                                    </div>
                                                </div>

                                                {expandedSub === worker._id && (
                                                    <div className="px-3 pb-2 pt-1 bg-accent/5 border-t border-border/30">
                                                        <div className="space-y-2">
                                                            <div className="pt-1">
                                                                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("projects.team_leader") || "Leader"}</span>
                                                                <ReadOnlyWorkerAttendanceItem
                                                                    worker={worker}
                                                                    status={attendanceMap[worker._id]}
                                                                    isLeader
                                                                />
                                                            </div>

                                                            {subWorkers.length > 0 && (
                                                                <div className="pt-1">
                                                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">{t("projects.team_members") || "Members"}</span>
                                                                    <div className="space-y-1.5">
                                                                        {subWorkers.map(sw => (
                                                                            <ReadOnlyWorkerAttendanceItem
                                                                                key={sw._id}
                                                                                worker={sw}
                                                                                status={attendanceMap[sw._id]}
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
                                            <ReadOnlyWorkerAttendanceItem
                                                worker={worker}
                                                status={attendanceMap[worker._id]}
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
        </div>
    )
}

function ReadOnlyWorkerAttendanceItem({ worker, status, className, isLeader }: any) {
    const { t } = useLanguage()
    const isPresentMarked = status?.present === true
    const isAbsentMarked = status?.present === false

    return (
        <div className={`bg-card/50 rounded-lg px-3 py-2 border transition-all ${className} ${isPresentMarked
            ? 'border-green-500/30 bg-green-500/5'
            : isAbsentMarked
                ? 'border-red-500/30 bg-red-500/5'
                : 'border-border/30'
            }`}>
            <div className="flex items-center justify-between gap-3">
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
                                    {t("projects.leader") || "Leader"}
                                </Badge>
                            )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate">{worker.trade}</div>
                    </div>
                </div>

                <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-center">
                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-0.5">{t("projects.days") || "Days"}</label>
                        <span className="w-12 h-8 rounded-md bg-background/50 border border-border/40 flex justify-center items-center text-sm font-semibold text-foreground">
                            {status?.dayValue ?? 1}
                        </span>
                    </div>

                    <div className="flex gap-1">
                        {isPresentMarked && (
                            <div className="h-8 w-8 rounded-md flex items-center justify-center bg-green-500 text-white">
                                <CheckSquare className="w-4 h-4" />
                            </div>
                        )}
                        {isAbsentMarked && (
                            <div className="h-8 w-8 rounded-md flex items-center justify-center bg-red-500 text-white">
                                <AlertCircle className="w-4 h-4" />
                            </div>
                        )}
                        {!isPresentMarked && !isAbsentMarked && (
                            <div className="h-8 px-2 rounded-md flex items-center justify-center bg-background/80 border border-border/40 text-xs font-semibold text-muted-foreground">
                                -
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function Spinner({ className }: { className?: string }) {
    return <div className={`h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin ${className}`} />
}
