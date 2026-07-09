"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Checkbox } from "@/components/ui/checkbox"
import { Bell, Volume2, ShieldAlert, Sparkles, HardHat, Check, Play, Settings, RefreshCw } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

export default function OwnerSettingsPage() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [managers, setManagers] = useState<any[]>([])
    
    // Setting Form State
    const [enabled, setEnabled] = useState(true)
    const [time, setTime] = useState("10:00")
    const [sound, setSound] = useState("default")
    const [vibration, setVibration] = useState(true)
    const [targetType, setTargetType] = useState("all") // "all" or "select"
    const [selectedManagers, setSelectedManagers] = useState<string[]>([])
    const [allProjects, setAllProjects] = useState<any[]>([])
    const [selectedProjects, setSelectedProjects] = useState<string[]>([])

    // Fetch managers, settings, and projects
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [usersRes, settingsRes, projectsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/notifications/reminder-setting'),
                    api.get('/projects')
                ])

                if (usersRes.data.success) {
                    // Filter managers and Admins so Owner can select themselves for testing
                    const filtered = usersRes.data.data.filter((u: any) => 
                        u.role === "Project Manager" || u.role === "Gérant" || u.role === "Admin" || u.role.toLowerCase().includes("manager") || u.role.toLowerCase() === "pm"
                    )
                    setManagers(filtered)
                }

                if (projectsRes.data.success) {
                    setAllProjects(projectsRes.data.data)
                }

                if (settingsRes.data.success && settingsRes.data.data) {
                    const data = settingsRes.data.data
                    setEnabled(data.enabled)
                    setTime(data.time || "10:00")
                    setSound(data.sound || "default")
                    setVibration(data.vibration !== false)
                    setSelectedProjects(data.projects || [])
                    
                    if (data.managers && data.managers.length > 0) {
                        setTargetType("select")
                        setSelectedManagers(data.managers)
                    } else {
                        setTargetType("all")
                        setSelectedManagers([])
                    }
                }
            } catch (error) {
                console.error("Failed to load settings data", error)
                toast.error("Échec du chargement des paramètres")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [])

    const handlePlaySoundPreview = () => {
        try {
            const audio = new Audio(`/sounds/${sound}.wav`)
            audio.play().catch(e => {
                console.warn("Audio autoplay blocked by browser or file missing:", e)
                toast.warning("La lecture audio a été bloquée par le navigateur.")
            })
        } catch (error) {
            console.error("Error playing audio preview", error)
        }
    }

    const handleManagerToggle = (id: string) => {
        const isChecking = !selectedManagers.includes(id)
        
        // Find projects managed by this user
        const managerProjects = allProjects.filter(p => 
            p.managers?.some((m: any) => (m._id || m) === id)
        ).map(p => p._id)

        setSelectedManagers(prev => 
            isChecking ? [...prev, id] : prev.filter(mId => mId !== id)
        )

        setSelectedProjects(prev => {
            if (isChecking) {
                // Add all of this manager's projects by default
                const newProjects = managerProjects.filter(pId => !prev.includes(pId))
                return [...prev, ...newProjects]
            } else {
                // Remove all of this manager's projects
                return prev.filter(pId => !managerProjects.includes(pId))
            }
        })
    }

    const handleProjectToggle = (projectId: string) => {
        setSelectedProjects(prev => 
            prev.includes(projectId) ? prev.filter(id => id !== projectId) : [...prev, projectId]
        )
    }

    const handleSaveSettings = async () => {
        try {
            setSaving(true)
            const payload = {
                enabled,
                time,
                sound,
                vibration,
                managers: targetType === "all" ? [] : selectedManagers,
                projects: targetType === "all" ? [] : selectedProjects
            }

            const res = await api.post('/notifications/reminder-setting', payload)
            if (res.data.success) {
                toast.success("Paramètres enregistrés avec succès !")
            }
        } catch (error) {
            console.error("Failed to save settings", error)
            toast.error("Échec de l'enregistrement des paramètres")
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[70vh] items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                        <RefreshCw className="h-6 w-6 text-primary animate-spin" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Chargement des paramètres...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-300">
            {/* Header */}
            <div className="flex items-center justify-between border-b pb-5">
                <div>
                    <h1 className="text-3xl font-display font-bold tracking-tight text-foreground flex items-center gap-2">
                        <Settings className="w-8 h-8 text-primary" />
                        Paramètres Système
                    </h1>
                    <p className="text-muted-foreground mt-1.5">
                        Configurez les rappels quotidiens automatiques de pointage pour les chantiers.
                    </p>
                </div>
            </div>

            <Card className="glass-card shadow-xl">
                        <CardHeader>
                            <CardTitle className="text-xl font-bold flex items-center gap-2">
                                <Bell className="w-5 h-5 text-primary" />
                                Configuration du Rappel Automatique
                            </CardTitle>
                            <CardDescription>
                                Déterminez l'heure de déclenchement, le type d'alerte et les destinataires.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Activer/Désactiver */}
                            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border">
                                <div className="space-y-0.5">
                                    <Label htmlFor="reminder-active" className="text-base font-semibold">
                                        Activer le rappel quotidien
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Envoie un rappel si le pointage n'est pas fait.
                                    </p>
                                </div>
                                <Switch
                                    id="reminder-active"
                                    checked={enabled}
                                    onCheckedChange={setEnabled}
                                />
                            </div>

                            {enabled && (
                                <div className="space-y-6 animate-in slide-in-from-top-4 duration-300">
                                    {/* Command Bar: Time, Sound, Vibration */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end p-4 bg-muted/20 rounded-2xl border">
                                        {/* Heure limit */}
                                        <div className="space-y-2">
                                            <Label htmlFor="reminder-time" className="font-semibold text-sm">
                                                Heure limite de pointage
                                            </Label>
                                            <Input
                                                id="reminder-time"
                                                type="time"
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full h-11 text-base font-medium"
                                            />
                                        </div>

                                        {/* Sonnerie */}
                                        <div className="space-y-2">
                                            <Label htmlFor="reminder-sound" className="font-semibold text-sm">
                                                Son de la Notification
                                            </Label>
                                            <div className="flex gap-2">
                                                <Select value={sound} onValueChange={setSound}>
                                                    <SelectTrigger id="reminder-sound" className="w-full h-11">
                                                        <SelectValue placeholder="Sélectionnez un son" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="default">Défaut (Doux)</SelectItem>
                                                        <SelectItem value="bell">Cloche (Ringing)</SelectItem>
                                                        <SelectItem value="alarm">Alarme Numérique</SelectItem>
                                                        <SelectItem value="red_alert">Alerte Rouge (Siren)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    onClick={handlePlaySoundPreview}
                                                    className="h-11 w-11 shrink-0 bg-background"
                                                    title="Écouter un aperçu"
                                                >
                                                    <Play className="w-4 h-4 text-primary" />
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Vibration */}
                                        <div className="flex items-center justify-between p-3.5 bg-background rounded-xl border border-dashed h-11">
                                            <div className="grid gap-0.5 leading-none">
                                                <Label htmlFor="vibe-active" className="text-sm font-semibold cursor-pointer">
                                                    Vibration du Téléphone
                                                </Label>
                                                <span className="text-[10px] text-muted-foreground">Faire vibrer le mobile</span>
                                            </div>
                                            <Switch
                                                id="vibe-active"
                                                checked={vibration}
                                                onCheckedChange={setVibration}
                                            />
                                        </div>
                                    </div>

                                    {/* Destinataires */}
                                    <div className="space-y-3">
                                        <Label className="font-semibold text-sm">
                                            Managers ciblés (Destinataires)
                                        </Label>
                                        <RadioGroup value={targetType} onValueChange={setTargetType} className="grid grid-cols-2 gap-3">
                                            <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-xl border cursor-pointer hover:bg-muted/40 transition-colors">
                                                <RadioGroupItem value="all" id="target-all" />
                                                <Label htmlFor="target-all" className="cursor-pointer font-medium text-sm">
                                                    Tous les managers
                                                </Label>
                                            </div>
                                            <div className="flex items-center space-x-3 p-3 bg-muted/20 rounded-xl border cursor-pointer hover:bg-muted/40 transition-colors">
                                                <RadioGroupItem value="select" id="target-select" />
                                                <Label htmlFor="target-select" className="cursor-pointer font-medium text-sm">
                                                    Sélectionner...
                                                </Label>
                                            </div>
                                        </RadioGroup>

                                        {targetType === "select" && (
                                            <div className="p-5 bg-muted/10 rounded-2xl border border-muted-foreground/10 space-y-4 animate-in slide-in-from-top-2 duration-200">
                                                {managers.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground py-4 text-center">Aucun manager trouvé.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                        {managers.map((m) => {
                                                            const managerProjects = allProjects.filter(p => 
                                                                p.managers?.some((mgr: any) => (mgr._id || mgr) === m._id)
                                                            )
                                                            const isChecked = selectedManagers.includes(m._id)
                                                            return (
                                                                <div 
                                                                    key={m._id} 
                                                                    className={`border rounded-2xl p-4 transition-all duration-300 ${
                                                                        isChecked 
                                                                            ? 'bg-background border-primary/30 shadow-sm' 
                                                                            : 'bg-background/20 border-muted-foreground/10 opacity-75 hover:opacity-100 hover:bg-background/30'
                                                                    }`}
                                                                >
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center space-x-3">
                                                                            <Checkbox
                                                                                id={`m-${m._id}`}
                                                                                checked={isChecked}
                                                                                onCheckedChange={() => handleManagerToggle(m._id)}
                                                                                className="h-5 w-5"
                                                                            />
                                                                            <div className="grid gap-1">
                                                                                <Label 
                                                                                    htmlFor={`m-${m._id}`} 
                                                                                    className="cursor-pointer text-base font-bold text-foreground"
                                                                                >
                                                                                    {m.name}
                                                                                </Label>
                                                                                <div className="flex items-center gap-2">
                                                                                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-semibold uppercase tracking-wider">
                                                                                        {m.role}
                                                                                    </span>
                                                                                    {isChecked && managerProjects.length > 0 && (
                                                                                        <span className="text-[10px] text-muted-foreground">
                                                                                            {managerProjects.length} chantier(s) assigné(s)
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    
                                                                    {isChecked && managerProjects.length > 0 && (
                                                                        <div className="mt-4 pl-8 border-l-2 border-primary/20 space-y-3 animate-in slide-in-from-left-2 duration-200">
                                                                            <div className="bg-muted/20 rounded-xl p-3.5 border border-muted-foreground/5 space-y-2.5">
                                                                                <span className="text-xs font-semibold text-foreground/80 flex items-center gap-1.5">
                                                                                    <HardHat className="w-3.5 h-3.5 text-primary" />
                                                                                    Chantiers à surveiller :
                                                                                </span>
                                                                                <div className="divide-y divide-muted-foreground/5 space-y-2">
                                                                                    {managerProjects.map((proj, idx) => {
                                                                                        const isProjChecked = selectedProjects.includes(proj._id)
                                                                                        return (
                                                                                            <div 
                                                                                                key={proj._id} 
                                                                                                className={`flex items-start space-x-3 pt-2 ${idx === 0 ? 'pt-0' : 'border-t border-muted-foreground/5'}`}
                                                                                            >
                                                                                                <Checkbox
                                                                                                    id={`proj-${m._id}-${proj._id}`}
                                                                                                    checked={isProjChecked}
                                                                                                    onCheckedChange={() => handleProjectToggle(proj._id)}
                                                                                                    className="h-4.5 w-4.5 mt-0.5"
                                                                                                />
                                                                                                <div className="grid gap-1 flex-1 leading-tight">
                                                                                                    <Label 
                                                                                                        htmlFor={`proj-${m._id}-${proj._id}`}
                                                                                                        className={`text-sm cursor-pointer font-medium transition-colors ${
                                                                                                            isProjChecked ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
                                                                                                        }`}
                                                                                                    >
                                                                                                        {proj.name}
                                                                                                    </Label>
                                                                                                    <div className="flex items-center gap-2 mt-0.5">
                                                                                                        <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                                                                                                            proj.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'
                                                                                                        }`}>
                                                                                                            {proj.status}
                                                                                                        </span>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        )
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Action bar */}
                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    onClick={handleSaveSettings}
                                    disabled={saving}
                                    className="px-6 h-11 font-medium bg-primary hover:bg-primary/95 shadow-lg active:scale-95 transition-transform"
                                >
                                    {saving ? "Enregistrement..." : "Enregistrer les modifications"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
        </div>
    )
}
