"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ArrowLeft, MapPin, Calendar, Banknote, User, Building, History, FolderKanban, Pencil, Trash2, Users, PieChart as PieChartIcon, CloudSun } from "lucide-react"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { UpdateProjectStatusDialog } from "@/components/admin/update-project-status-dialog"
import { UpdateLocationDialog } from "@/components/admin/update-location-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface Project {
    _id: string
    name: string
    location: string
    coordinates?: { lat: number, lng: number }
    status: "active" | "completed" | "on-hold" | "planning"
    startDate: string
    endDate: string
    manager: { name: string; email: string } | null
    progress: number
    description?: string
    tasks: any[]
}

const statusColors: Record<string, string> = {
    active: "bg-success/20 text-success border-success/30",
    completed: "bg-primary/20 text-primary border-primary/30",
    "on-hold": "bg-warning/20 text-warning border-warning/30",
    planning: "bg-secondary/20 text-secondary border-secondary/30",
}

export default function ProjectDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [history, setHistory] = useState<any[]>([])
    const [team, setTeam] = useState<any[]>([])
    const [weather, setWeather] = useState<any>(null)
    const { t, language } = useLanguage()
    const isRTL = language === "ar"

    // Actions State
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [locationDialogOpen, setLocationDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const fetchProject = async () => {
        try {
            const res = await api.get(`/projects/${id}`)
            if (res.data.success) {
                setProject(res.data.data)
                if (res.data.data.coordinates && res.data.data.coordinates.lat) {
                    fetchWeatherByCoords(res.data.data.coordinates.lat, res.data.data.coordinates.lng)
                } else if (res.data.data.location) {
                    fetchWeather(res.data.data.location)
                }
            }
        } catch (error: any) {
            toast.error("Failed to fetch project details")
            router.push("/admin/projects")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchHistory = async () => {
        try {
            const res = await api.get(`/projects/${id}/history`)
            if (res.data.success) {
                setHistory(res.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch history")
        }
    }

    const fetchTeam = async () => {
        try {
            const res = await api.get(`/projects/${id}/team`)
            if (res.data.success) {
                setTeam(res.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch team")
        }
    }

    const fetchWeather = async (location: string) => {
        try {
            const parts = location.split(',').map(p => p.trim());
            const city = parts[0];

            const getCoords = async (query: string) => {
                if (!query) return null;
                const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
                )
                const data = await res.json()
                return data.results?.[0]
            }

            let result = await getCoords(city)

            if (!result) {
                const normalizedCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                if (normalizedCity !== city) {
                    result = await getCoords(normalizedCity)
                }
            }

            if (!result && parts.length > 1) {
                result = await getCoords(parts[1]);
            }

            if (!result) {
                result = await getCoords("Tunis")
            }

            if (!result) return;

            const { latitude, longitude } = result

            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
            )
            const weatherData = await weatherRes.json()

            if (weatherData.current) {
                const weatherCode = weatherData.current.weather_code
                let condition = 'Clear'
                if (weatherCode >= 61 && weatherCode <= 67) condition = 'Rainy'
                else if (weatherCode >= 71 && weatherCode <= 77) condition = 'Snowy'
                else if (weatherCode >= 80 && weatherCode <= 82) condition = 'Stormy'
                else if (weatherCode >= 51 && weatherCode <= 57) condition = 'Drizzle'
                else if (weatherCode >= 1 && weatherCode <= 3) condition = 'Cloudy'
                else if (weatherCode === 0) condition = 'Sunny'

                setWeather({
                    temp: Math.round(weatherData.current.temperature_2m),
                    condition,
                    wind: Math.round(weatherData.current.wind_speed_10m)
                })
            }
        } catch (error) {
            console.error("Failed to fetch weather", error)
        }
    }

    useEffect(() => {
        if (id) {
            fetchProject()
            fetchHistory()
            fetchTeam()
        }
    }, [id])

    const fetchWeatherByCoords = async (lat: number, lng: number) => {
        try {
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
            )
            const weatherData = await weatherRes.json()

            if (weatherData.current) {
                const weatherCode = weatherData.current.weather_code
                let condition = 'Clear'
                if (weatherCode >= 61 && weatherCode <= 67) condition = 'Rainy'
                else if (weatherCode >= 71 && weatherCode <= 77) condition = 'Snowy'
                else if (weatherCode >= 80 && weatherCode <= 82) condition = 'Stormy'
                else if (weatherCode >= 51 && weatherCode <= 57) condition = 'Drizzle'
                else if (weatherCode >= 1 && weatherCode <= 3) condition = 'Cloudy'
                else if (weatherCode === 0) condition = 'Sunny'

                setWeather({
                    temp: Math.round(weatherData.current.temperature_2m),
                    condition,
                    wind: Math.round(weatherData.current.wind_speed_10m)
                })
            }
        } catch (error) {
            console.error("Failed to fetch weather by coords")
        }
    }

    const handleDelete = async () => {
        if (!project) return
        try {
            const res = await api.delete(`/projects/${project._id}`)
            if (res.data.success) {
                toast.success(t("projects.delete_success") || "Project deleted successfully")
                router.push("/admin/projects")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete project")
        }
    }

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center">Loading...</div>
    }

    if (!project) return null

    return (
        <div className="space-y-6">
            {/* Header with Stats & Weather */}
            <div className={cn("flex flex-col gap-4 md:flex-row md:items-start md:justify-between", isRTL && "md:flex-row-reverse")}>
                <div className={cn("flex items-start gap-4", isRTL && "flex-row-reverse")}>
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className={cn("h-4 w-4", isRTL && "rotate-180")} />
                    </Button>
                    <div className={isRTL ? "text-right" : "text-left"}>
                        <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
                            <h1 className="font-display text-3xl font-bold tracking-tight">{project.name}</h1>
                        </div>
                        <div className="flex flex-col gap-1 mt-1 group cursor-pointer" onClick={() => setLocationDialogOpen(true)}>
                            <div className={cn("flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors", isRTL && "flex-row-reverse")}>
                                <MapPin className="h-4 w-4" />
                                <span>{project.location}</span>
                                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                    {weather && (
                        <Card className="bg-primary/5 border-primary/10 shadow-sm">
                            <CardContent className={cn("p-3 flex items-center gap-3", isRTL && "flex-row-reverse")}>
                                <CloudSun className="h-8 w-8 text-primary" />
                                <div className={isRTL ? "text-right" : "text-left"}>
                                    <p className="text-lg font-bold text-primary">{weather.temp}°C</p>
                                    <p className="text-xs text-muted-foreground">{weather.condition}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                        <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
                            <Pencil className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t("projects.update_status") || "Update Status"}
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
                            <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {t("common.delete") || "Delete"}
                        </Button>
                    </div>
                </div>
            </div>

            <div className={cn("grid gap-6 md:grid-cols-3", isRTL && "md:grid-flow-col-dense")}>
                {/* Main Content Column */}
                <div className={cn("md:col-span-2 space-y-6", isRTL && "md:col-start-2")}>
                    {/* Overview Card */}
                    <Card className={isRTL ? "text-right" : "text-left"}>
                        <CardHeader className={cn(isRTL && "flex-row-reverse")}>
                            <CardTitle>{t("projects.overview_title") || "Project Overview"}</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className={cn("grid grid-cols-2 gap-6", isRTL && "flex-row-reverse")}>
                                <div className="space-y-1">
                                    <span className={cn("text-sm text-muted-foreground flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                        <User className="h-4 w-4" /> {t("projects.manager") || "Manager"}
                                    </span>
                                    <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                            {project.manager?.name?.substring(0, 2).toUpperCase() || "NA"}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{project.manager?.name || t("common.unassigned") || "Unassigned"}</p>
                                            <p className="text-xs text-muted-foreground">{project.manager?.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className={cn("text-sm text-muted-foreground flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                        <Calendar className="h-4 w-4" /> {t("projects.timeline") || "Timeline"}
                                    </span>
                                    <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}  →  {new Date(project.endDate).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <div className={cn("flex justify-between items-center text-sm", isRTL && "flex-row-reverse")}>
                                    <span className="text-muted-foreground">{t("projects.completion") || "Completion"}</span>
                                    <span className="font-medium text-primary">{project.progress || 0}%</span>
                                </div>
                                <Progress value={project.progress || 0} className="h-2" />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Members */}
                    <Card className={isRTL ? "text-right" : "text-left"}>
                        <CardHeader className={cn(isRTL && "flex-row-reverse")}>
                            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                <Users className="h-5 w-5 text-primary" />
                                {t("projects.team") || "Project Team"}
                            </CardTitle>
                            <CardDescription>{t("projects.team_desc") || "Active workers currently assigned to this site."}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {team.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    {t("projects.no_workers") || "No workers currently scheduled."}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {team.map((worker: any) => (
                                        <div key={worker._id} className={cn("flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors", isRTL && "flex-row-reverse")}>
                                            <Avatar>
                                                <AvatarFallback className="bg-primary/10 text-primary">
                                                    {worker.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium text-sm">{worker.name}</p>
                                                <p className="text-xs text-muted-foreground">{worker.trade}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* History */}
                    <Card className={isRTL ? "text-right" : "text-left"}>
                        <CardHeader className={cn(isRTL && "flex-row-reverse")}>
                            <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                                <History className="h-5 w-5 text-muted-foreground" />
                                {t("common.activity_log") || "Activity Log"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className={cn("space-y-6 relative ml-2", isRTL ? "pr-4 border-r-2 border-muted" : "pl-4 border-l-2 border-muted ")}>
                                {history.length === 0 ? (
                                    <div className={cn("text-sm text-muted-foreground", isRTL ? "pr-4" : "pl-4")}>
                                        {t("common.no_activity") || "No recent activity."}
                                    </div>
                                ) : (
                                    history.slice(0, 5).map((log: any) => (
                                        <div key={log._id} className="relative">
                                            <div className={cn("absolute top-1 h-3 w-3 rounded-full bg-background border-2 border-primary", isRTL ? "-right-[25px]" : "-left-[25px]")} />
                                            <p className="text-sm font-medium">
                                                <span className="capitalize">{log.action}</span> {t("common.by") || "by"} <span className="text-primary">{log.userId?.name || "System"}</span>
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Column */}
                <div className="space-y-6">
                    <Card className={isRTL ? "text-right" : "text-left"}>
                        <CardHeader className={cn(isRTL && "flex-row-reverse")}>
                            <CardTitle>{t("common.quick_stats") || "Quick Stats"}</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-sm text-muted-foreground mb-1">{t("projects.total_tasks") || "Total Tasks"}</p>
                                <p className="text-3xl font-bold text-primary">{project.tasks?.length || 0}</p>
                            </div>
                            <div className="p-4 bg-muted/40 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">{t("projects.team_size") || "Team Size"}</p>
                                <p className="text-2xl font-bold">{team.length}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            <UpdateProjectStatusDialog
                project={project}
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                onStatusUpdated={() => {
                    fetchProject()
                    fetchHistory()
                }}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={isRTL ? "text-right" : ""}>
                            {t("projects.delete_confirm_title") || "Are you absolutely sure?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className={isRTL ? "text-right" : ""}>
                            {t("projects.delete_confirm_desc") || "This action cannot be undone. This will permanently delete the project and remove all associated data."}
                            <span className="font-bold block mt-2 text-primary">{project.name}</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={isRTL ? "flex-row-reverse gap-2" : ""}>
                        <AlertDialogCancel>{t("common.cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("common.delete") || "Delete Project"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <UpdateLocationDialog
                project={project}
                open={locationDialogOpen}
                onOpenChange={setLocationDialogOpen}
                onLocationUpdated={fetchProject}
            />
        </div>
    )
}


// Add fetchWeatherByCoords helper inside component
// ... (Actually, I need to insert it inside the component body, not here at the end)
