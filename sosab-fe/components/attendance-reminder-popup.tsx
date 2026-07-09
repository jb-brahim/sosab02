"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { AlertTriangle, Clock, ChevronRight, X, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"
import { useRouter } from "next/navigation"

export function AttendanceReminderPopup() {
    const { user } = useAuth()
    const router = useRouter()
    const [isOpen, setIsOpen] = useState(false)
    const [pendingProjects, setPendingProjects] = useState<any[]>([])

    useEffect(() => {
        // Only run for PM and Gérant roles who manage attendance
        if (!user || (user.role !== "pm" && user.role !== "gerant" && user.role !== "admin")) return

        const checkStatus = async () => {
            try {
                // Check if already dismissed in this session
                const dismissed = sessionStorage.getItem("dismissed-attendance-reminder")
                if (dismissed === "true") return

                const res = await api.get('/attendance/status/today')
                if (res.data.success && res.data.attendanceRequired && res.data.projects.length > 0) {
                    setPendingProjects(res.data.projects)
                    setIsOpen(true)
                }
            } catch (err) {
                console.error("Failed to check daily attendance status", err)
            }
        }

        checkStatus()
    }, [user])

    const handleDismiss = () => {
        sessionStorage.setItem("dismissed-attendance-reminder", "true")
        setIsOpen(false)
    }

    const handleActionClick = (projectId: string) => {
        handleDismiss()
        if (user?.role === "gerant") {
            router.push(`/gerant/projects/${projectId}?tab=attendance`)
        } else {
            router.push(`/app/projects/${projectId}?tab=attendance`)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-red-500/30 bg-card/90 p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                {/* Red warning glow background */}
                <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />
                <div className="absolute -right-12 -bottom-12 h-32 w-32 rounded-full bg-red-500/10 blur-3xl pointer-events-none" />

                {/* Dismiss button */}
                <button
                    onClick={handleDismiss}
                    className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground hover:bg-muted transition-colors"
                >
                    <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-500 border border-red-500/20 shadow-lg shadow-red-500/10 animate-bounce">
                        <AlertTriangle className="h-7 w-7" />
                    </div>

                    <div className="space-y-1">
                        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-1.5">
                            Rappel: Pointage Requis
                        </h2>
                        <p className="text-sm text-muted-foreground px-2">
                            Vous n'avez pas encore enregistré les présences d'aujourd'hui pour certains de vos chantiers.
                        </p>
                    </div>

                    {/* Pending projects list */}
                    <div className="w-full space-y-2 max-h-48 overflow-y-auto pr-1 py-1">
                        {pendingProjects.map((project) => (
                            <div 
                                key={project.id}
                                className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/50 hover:border-red-500/20 transition-all"
                            >
                                <div className="text-left">
                                    <p className="text-sm font-bold text-foreground leading-tight">{project.name}</p>
                                    <p className="text-xs text-muted-foreground mt-0.5">{project.location}</p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleActionClick(project.id)}
                                    className="h-8 px-3 text-xs bg-red-500 hover:bg-red-600 text-white font-medium rounded-xl flex items-center gap-1 active:scale-95 transition-transform"
                                >
                                    Remplir
                                    <ChevronRight className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>

                    {/* Footer buttons */}
                    <div className="w-full pt-2 flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleDismiss}
                            className="flex-1 h-11 rounded-2xl border-border/80 text-muted-foreground hover:text-foreground font-medium"
                        >
                            Plus tard
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}
