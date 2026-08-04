"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Compass, AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

export function GpsEnforcerModal() {
    const { user } = useAuth()
    const [mustForceGps, setMustForceGps] = useState(false)
    const [requesting, setRequesting] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")

    useEffect(() => {
        if (!user || user.role === "admin") return

        const checkGpsRequirement = async () => {
            try {
                const res = await api.get('/notifications/reminder-setting')
                if (res.data.success && res.data.data && res.data.data.requireGps) {
                    const data = res.data.data
                    const userIdStr = String(user.id || (user as any)._id)
                    const isTargeted = data.gpsTargetType === "all" || 
                        !data.gpsManagers || 
                        data.gpsManagers.length === 0 || 
                        data.gpsManagers.some((mId: any) => String(mId._id || mId) === userIdStr)

                    if (!isTargeted) {
                        setMustForceGps(false)
                        return
                    }

                    // Check if GPS lat/lon is missing or permission is not granted
                    const cachedLat = localStorage.getItem('sosab-lat')
                    if (!cachedLat) {
                        setMustForceGps(true)
                        return
                    }

                    if ("permissions" in navigator && navigator.permissions.query) {
                        const perm = await navigator.permissions.query({ name: "geolocation" as PermissionName })
                        if (perm.state !== "granted") {
                            setMustForceGps(true)
                        } else {
                            setMustForceGps(false)
                        }
                    }
                } else {
                    setMustForceGps(false)
                }
            } catch (err) {
                console.error("Failed to check GPS requirement settings:", err)
            }
        }

        checkGpsRequirement()
    }, [user])

    const handleEnableGps = () => {
        if (!("geolocation" in navigator)) {
            setErrorMsg("La géolocalisation n'est pas supportée par votre navigateur.")
            return
        }

        setRequesting(true)
        setErrorMsg("")

        navigator.geolocation.getCurrentPosition(
            (position) => {
                localStorage.setItem("sosab-lat", position.coords.latitude.toString())
                localStorage.setItem("sosab-lon", position.coords.longitude.toString())
                localStorage.setItem("sosab-gps-time", Date.now().toString())
                localStorage.removeItem("sosab-gps-denied")
                
                setRequesting(false)
                setMustForceGps(false)
                console.log("✓ Mandatory GPS location granted:", position.coords.latitude, position.coords.longitude)
            },
            (error) => {
                setRequesting(false)
                if (error.code === error.PERMISSION_DENIED) {
                    setErrorMsg("Accès refusé. Veuillez autoriser la localisation dans les paramètres de votre navigateur/téléphone.")
                } else {
                    setErrorMsg("Impossible de récupérer la position GPS. Assurez-vous que le GPS de votre téléphone est activé.")
                }
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        )
    }

    if (!mustForceGps) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="relative w-full max-w-md overflow-hidden rounded-3xl border border-blue-500/40 bg-card p-6 shadow-2xl backdrop-blur-xl animate-in zoom-in-95 duration-200">
                {/* Background Glow */}
                <div className="absolute -left-12 -top-12 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />

                <div className="flex flex-col items-center text-center space-y-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/10 animate-pulse">
                        <Compass className="h-8 w-8" />
                    </div>

                    <div className="space-y-2">
                        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2">
                            Géolocalisation Obligatoire
                        </h2>
                        <p className="text-sm text-muted-foreground px-2">
                            Le propriétaire de l'entreprise exige l'activation de la géolocalisation GPS pour pouvoir utiliser l'application.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-xs text-red-500 font-medium leading-relaxed">
                            <AlertTriangle className="w-4 h-4 inline mr-1 -mt-0.5" />
                            {errorMsg}
                        </div>
                    )}

                    <div className="w-full pt-2">
                        <Button
                            onClick={handleEnableGps}
                            disabled={requesting}
                            className="w-full h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-600/20 active:scale-95 transition-transform"
                        >
                            <Compass className="w-5 h-5 mr-2" />
                            {requesting ? "Activation en cours..." : "Activer la Localisation GPS"}
                        </Button>
                    </div>

                    <p className="text-[11px] text-muted-foreground/80 italic">
                        L'autorisation ne vous sera demandée qu'une seule fois.
                    </p>
                </div>
            </div>
        </div>
    )
}
