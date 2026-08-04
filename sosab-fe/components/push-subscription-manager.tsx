"use client"

import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
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

    useEffect(() => {
        if (!user) return

        async function registerPush() {
            try {
                if (!("serviceWorker" in navigator)) {
                    console.warn("Service workers are not supported in this browser.")
                    return
                }

                const registration = await navigator.serviceWorker.register("/sw.js")
                console.log("Service Worker registered with scope:", registration.scope)

                // Request Notification permission explicitly if not yet granted
                if ("Notification" in window && Notification.permission !== "granted") {
                    const permission = await Notification.requestPermission()
                    if (permission !== "granted") {
                        console.warn("Notification permission denied by user.")
                        return
                    }
                }

                const subscription = await registration.pushManager.getSubscription()
                const SUB_VERSION = "v4" // Increment version to force fresh subscription
                const currentVersion = localStorage.getItem("sosab-push-version")

                // If old subscription exists but version doesn't match, unsubscribe first
                if (subscription && currentVersion !== SUB_VERSION) {
                    console.log("Unsubscribing old push subscription due to VAPID key change...")
                    await subscription.unsubscribe()
                    localStorage.removeItem("sosab-push-version")
                }

                if (!subscription || currentVersion !== SUB_VERSION) {
                    const newSubscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                    })

                    await api.post("/notifications/subscribe", newSubscription)
                    localStorage.setItem("sosab-push-version", SUB_VERSION)
                    console.log("Push subscription successful (version " + SUB_VERSION + ")")
                }
            } catch (error) {
                console.error("Failed to register push subscription:", error)
            }
        }

        registerPush()

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

            // User interaction listener to stop sound immediately upon tapping/clicking
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

    return null
}
