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
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface Project {
    _id: string
    name: string
    location: string
    coordinates?: { lat: number, lng: number }
    status: "active" | "completed" | "on-hold" | "planning"
    startDate: string
    endDate: string
    budget: number
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

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function ProjectDetailsPage() {
    const { id } = useParams()
    const router = useRouter()
    const [project, setProject] = useState<Project | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [history, setHistory] = useState<any[]>([])
    const [team, setTeam] = useState<any[]>([])
    const [weather, setWeather] = useState<any>(null)

    // Actions State
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [locationDialogOpen, setLocationDialogOpen] = useState(false)
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)

    const fetchProject = async () => {
        try {
            const res = await api.get(`/projects/${id}`)
            if (res.data.success) {
                console.log("PROJECT DATA RECEIVED:", res.data.data) // Debug log
                setProject(res.data.data)
                // Prefer coordinates if available, otherwise geocode string
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
            console.log("Fetching weather for:", city);

            // Helper to fetch coordinates
            const getCoords = async (query: string) => {
                if (!query) return null;
                const res = await fetch(
                    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
                )
                const data = await res.json()
                return data.results?.[0]
            }

            // Attempt 1: Exact match of first part
            let result = await getCoords(city)

            // Attempt 2: Normalize first part
            if (!result) {
                const normalizedCity = city.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
                if (normalizedCity !== city) {
                    console.log("Retrying with normalized name:", normalizedCity)
                    result = await getCoords(normalizedCity)
                }
            }

            // Attempt 3: Try second part (Region/Governorate) e.g. "Sousse" from "Kalaa Kebira, Sousse"
            if (!result && parts.length > 1) {
                const region = parts[1];
                console.log("City not found, trying region:", region);
                result = await getCoords(region);
            }

            // Attempt 4: Top-level fallback (Tunis)
            if (!result) {
                console.warn("Location not found, defaulting to Tunis")
                result = await getCoords("Tunis")
            }

            if (!result) return;

            const { latitude, longitude } = result

            // Step 2: Fetch weather data using coordinates
            const weatherRes = await fetch(
                `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code,wind_speed_10m&timezone=auto`
            )
            const weatherData = await weatherRes.json()

            if (weatherData.current) {
                // Map weather codes to conditions
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
    }, [id, router])

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

    const handleArchive = async () => {
        if (!project) return
        try {
            const res = await api.delete(`/projects/${project._id}`)
            if (res.data.success) {
                toast.success("Project archived successfully")
                router.push("/admin/projects")
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to archive project")
        }
    }

    // Task Analytics Data
    const taskData = project?.tasks ? [
        { name: 'Completed', value: project.tasks.filter(t => t.status === 'Completed').length },
        { name: 'In Progress', value: project.tasks.filter(t => t.status === 'In Progress').length },
        { name: 'Not Started', value: project.tasks.filter(t => t.status === 'Not Started').length },
    ].filter(d => d.value > 0) : [];

    if (isLoading) {
        return <div className="flex h-96 items-center justify-center">Loading...</div>
    }

    if (!project) return null

    return (
        <div className="space-y-6">
            {/* Header with Stats & Weather */}
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="flex items-start gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="font-display text-3xl font-bold tracking-tight">{project.name}</h1>
                            <Badge className={statusColors[project.status] || "bg-muted"}>
                                {project.status}
                            </Badge>
                        </div>
                        <div className="flex flex-col gap-1 mt-1 group cursor-pointer" onClick={() => setLocationDialogOpen(true)}>
                            <div className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                                <MapPin className="h-4 w-4" />
                                <span>{project.location}</span>
                                <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            {project.coordinates && (
                                <p className="text-xs text-muted-foreground/60 ml-6 font-mono">
                                    {project.coordinates.lat.toFixed(6)}, {project.coordinates.lng.toFixed(6)}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {weather && (
                        <Card className="bg-primary/5 border-primary/10 shadow-sm">
                            <CardContent className="p-3 flex items-center gap-3">
                                <CloudSun className="h-8 w-8 text-primary" />
                                <div>
                                    <p className="text-lg font-bold text-primary">{weather.temp}°C</p>
                                    <p className="text-xs text-muted-foreground">{weather.condition}</p>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Update Status
                        </Button>
                        <Button variant="destructive" size="sm" onClick={() => setArchiveDialogOpen(true)}>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Archive
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                {/* Main Content Column */}
                <div className="md:col-span-2 space-y-6">
                    {/* Overview Card */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Project Overview</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <User className="h-4 w-4" /> Manager
                                    </span>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-medium text-xs">
                                            {project.manager?.name?.substring(0, 2).toUpperCase() || "NA"}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm">{project.manager?.name || "Unassigned"}</p>
                                            <p className="text-xs text-muted-foreground">{project.manager?.email}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Banknote className="h-4 w-4" /> Budget
                                    </span>
                                    <p className="font-display text-xl font-bold">{project.budget?.toLocaleString()} <span className="text-sm font-normal text-muted-foreground">TND</span></p>
                                </div>
                            </div>
                            <Separator />
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1">
                                    <span className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Calendar className="h-4 w-4" /> Timeline
                                    </span>
                                    <p className="font-medium">{new Date(project.startDate).toLocaleDateString()}  →  {new Date(project.endDate).toLocaleDateString()}</p>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-muted-foreground">Completion</span>
                                        <span className="font-medium text-primary">{project.progress || 0}%</span>
                                    </div>
                                    <Progress value={project.progress || 0} className="h-2" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Team Members */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Users className="h-5 w-5 text-primary" />
                                Project Team
                            </CardTitle>
                            <CardDescription>Active workers currently assigned to this site.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {team.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground text-sm border-2 border-dashed rounded-lg">
                                    No workers currently scheduled.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                                    {team.map((worker: any) => (
                                        <div key={worker._id} className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
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
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="h-5 w-5 text-muted-foreground" />
                                Activity Log
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-6 relative pl-4 border-l-2 border-muted ml-2">
                                {history.length === 0 ? (
                                    <div className="text-sm text-muted-foreground pl-4">No recent activity.</div>
                                ) : (
                                    history.slice(0, 5).map((log: any) => (
                                        <div key={log._id} className="relative pl-4">
                                            <div className="absolute -left-[21px] top-1 h-3 w-3 rounded-full bg-background border-2 border-primary" />
                                            <p className="text-sm font-medium">
                                                <span className="capitalize">{log.action}</span> by <span className="text-primary">{log.userId?.name || "System"}</span>
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
                    {/* Task Analytics Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <PieChartIcon className="h-5 w-5 text-primary" />
                                Task Distribution
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-[250px]">
                            {taskData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={taskData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={5}
                                            dataKey="value"
                                        >
                                            {taskData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend verticalAlign="bottom" height={36} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                                    No tasks to analyze
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="p-4 bg-primary/5 rounded-lg border border-primary/10">
                                <p className="text-sm text-muted-foreground mb-1">Total Tasks</p>
                                <p className="text-3xl font-bold text-primary">{project.tasks?.length || 0}</p>
                            </div>
                            <div className="p-4 bg-muted/40 rounded-lg">
                                <p className="text-sm text-muted-foreground mb-1">Team Size</p>
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

            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            <span className="font-semibold"> {project.name} </span>
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Archive Project
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
