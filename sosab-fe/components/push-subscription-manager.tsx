"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import api from "@/lib/api"

const VAPID_PUBLIC_KEY = "BASf2LIQZqR3HZ4B02FzS0TcqHGwvYlSY-_32Nrl6nMFzd8ftRfPU8Vk4oB2BtoviGCrptgwFO0HtlxT8tmU-D0"

function urlBase64ToUint8Array(base64String: string) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
}

export function PushSubscriptionManager() {
    const { user } = useAuth()
    const [showBanner, setShowBanner] = useState(false)

    const subscribeUser = async () => {
        try {
            if (typeof window === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
                return
            }

            const registration = await navigator.serviceWorker.register("/sw.js")
            
            let permission = Notification.permission
            if (permission === "default") {
                permission = await Notification.requestPermission()
            }

            if (permission !== "granted") {
                console.warn("Notification permission not granted:", permission)
                return
            }

            let activeSub = await registration.pushManager.getSubscription()
            if (!activeSub) {
                activeSub = await registration.pushManager.subscribe({
                    userVisibleOnly: true,
                    applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                })
            }

            if (activeSub) {
                await api.post("/notifications/subscribe", activeSub)
                setShowBanner(false)
                console.log("✓ Push subscription synced to backend DB for user:", user?.email)
            }
        } catch (error) {
            console.error("Failed to register push subscription:", error)
        }
    }

    useEffect(() => {
        if (!user) return

        if (typeof window !== "undefined" && "Notification" in window) {
            if (Notification.permission === "granted") {
                subscribeUser()
            } else if (Notification.permission === "default") {
                setShowBanner(true)
            }
        }

        // Listen for sound and vibration triggers from Service Worker or push messages
        let activeAudio: HTMLAudioElement | null = null

        const stopActiveAudio = () => {
            if (activeAudio) {
                try {
                    activeAudio.pause()
                    activeAudio.currentTime = 0
                } catch (e) {
                    // ignore
                }
                activeAudio = null
            }
            if ("vibrate" in navigator) {
                try {
                    navigator.vibrate(0)
                } catch (e) {
                    // ignore
                }
            }
        }

        if ("serviceWorker" in navigator) {
            const handleMessage = (event: MessageEvent) => {
                if (event.data && event.data.type === "PLAY_NOTIFICATION_SOUND") {
                    stopActiveAudio()
                    const soundPath = event.data.sound || "/sounds/default.wav"
                    try {
                        const audio = new Audio(soundPath)
                        activeAudio = audio
                        audio.play().catch(e => console.warn("Autoplay notification audio blocked:", e))
                    } catch (e) {
                        console.error("Audio playback error:", e)
                    }

                    if ("vibrate" in navigator && event.data.vibrate) {
                        try {
                            navigator.vibrate(event.data.vibrate)
                        } catch (e) {
                            console.warn("Vibration error:", e)
                        }
                    }
                }
            }

            window.addEventListener("pointerdown", stopActiveAudio, { once: true })
            window.addEventListener("keydown", stopActiveAudio, { once: true })

            navigator.serviceWorker.addEventListener("message", handleMessage)
            return () => {
                stopActiveAudio()
                window.removeEventListener("pointerdown", stopActiveAudio)
                window.removeEventListener("keydown", stopActiveAudio)
                navigator.serviceWorker.removeEventListener("message", handleMessage)
            }
        }
    }, [user])

    if (!user || !showBanner) return null

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md bg-amber-500 text-slate-950 p-3 rounded-2xl shadow-2xl border border-amber-400 flex items-center justify-between gap-3 animate-in slide-in-from-top-4 duration-300">
            <div className="flex items-center gap-2.5">
                <Bell className="w-5 h-5 shrink-0 animate-bounce text-slate-950" />
                <p className="text-xs font-bold leading-snug text-slate-950">
                    Activer les notifications mobile pour recevoir les rappels avec son & vibration.
                </p>
            </div>
            <Button
                size="sm"
                onClick={subscribeUser}
                className="bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs h-8 px-3 rounded-xl shrink-0"
            >
                Activer
            </Button>
        </div>
    )
}
