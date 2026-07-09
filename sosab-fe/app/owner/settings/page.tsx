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

    // Fetch managers and settings
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)
                const [usersRes, settingsRes] = await Promise.all([
                    api.get('/users'),
                    api.get('/notifications/reminder-setting')
                ])

                if (usersRes.data.success) {
                    // Filter managers and Admins so Owner can select themselves for testing
                    const filtered = usersRes.data.data.filter((u: any) => 
                        u.role === "Project Manager" || u.role === "Gérant" || u.role === "Admin" || u.role.toLowerCase().includes("manager") || u.role.toLowerCase() === "pm"
                    )
                    setManagers(filtered)
                }

                if (settingsRes.data.success && settingsRes.data.data) {
                    const data = settingsRes.data.data
                    setEnabled(data.enabled)
                    setTime(data.time || "10:00")
                    setSound(data.sound || "default")
                    setVibration(data.vibration !== false)
                    
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
        setSelectedManagers(prev => 
            prev.includes(id) ? prev.filter(mId => mId !== id) : [...prev, id]
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
                managers: targetType === "all" ? [] : selectedManagers
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Info Card / Quick settings */}
                <div className="md:col-span-1 space-y-6">
                    <Card className="glass-card border-primary/25 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-3 opacity-5 pointer-events-none">
                            <Bell className="w-24 h-24" />
                        </div>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2 text-foreground font-semibold">
                                <Sparkles className="w-4 h-4 text-primary" />
                                Rappel de Pointage
                            </CardTitle>
                            <CardDescription>
                                Un rappel intelligent pour éviter les oublis d'enregistrement.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                            <p>
                                Si les présences d'un chantier ne sont pas enregistrées avant l'heure fixée, le système enverra automatiquement une notification push urgente.
                            </p>
                            <div className="p-3 bg-primary/5 rounded-xl border border-primary/10 flex items-start gap-3">
                                <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                                <span className="text-xs text-foreground/80">
                                    Les managers recevront une vibration et le son choisi pour attirer leur attention.
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Configuration form */}
                <div className="md:col-span-2 space-y-6">
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
                                    {/* Heure de rappel */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="reminder-time" className="font-semibold text-sm">
                                                Heure limite de pointage
                                            </Label>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Heure à laquelle le rappel se déclenchera.
                                            </p>
                                            <Input
                                                id="reminder-time"
                                                type="time"
                                                value={time}
                                                onChange={(e) => setTime(e.target.value)}
                                                className="w-full h-11 text-lg font-medium"
                                            />
                                        </div>

                                        {/* Sonnerie */}
                                        <div className="space-y-2">
                                            <Label htmlFor="reminder-sound" className="font-semibold text-sm">
                                                Son de la Notification
                                            </Label>
                                            <p className="text-xs text-muted-foreground mb-1">
                                                Sonnerie jouée sur le téléphone du manager.
                                            </p>
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
                                                    className="h-11 w-11 shrink-0"
                                                    title="Écouter un aperçu"
                                                >
                                                    <Play className="w-4 h-4 text-primary" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Vibration */}
                                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-dashed">
                                        <div className="space-y-0.5">
                                            <Label htmlFor="vibe-active" className="text-sm font-semibold">
                                                Vibration du Téléphone
                                            </Label>
                                            <p className="text-xs text-muted-foreground">
                                                Faire vibrer le téléphone lors du rappel.
                                            </p>
                                        </div>
                                        <Switch
                                            id="vibe-active"
                                            checked={vibration}
                                            onCheckedChange={setVibration}
                                        />
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
                                            <div className="p-4 bg-muted/20 rounded-2xl border space-y-3 max-h-60 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                                                {managers.length === 0 ? (
                                                    <p className="text-sm text-muted-foreground py-2 text-center">Aucun manager trouvé.</p>
                                                ) : (
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                        {managers.map((m) => (
                                                            <div key={m._id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-background/50 transition-colors">
                                                                <Checkbox
                                                                    id={`m-${m._id}`}
                                                                    checked={selectedManagers.includes(m._id)}
                                                                    onCheckedChange={() => handleManagerToggle(m._id)}
                                                                />
                                                                <div className="grid gap-0.5 leading-none">
                                                                    <Label htmlFor={`m-${m._id}`} className="cursor-pointer text-sm font-semibold flex items-center gap-1.5">
                                                                        {m.name}
                                                                    </Label>
                                                                    <span className="text-[10px] text-primary font-medium uppercase tracking-wide opacity-80">{m.role}</span>
                                                                </div>
                                                            </div>
                                                        ))}
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
            </div>
        </div>
    )
}
