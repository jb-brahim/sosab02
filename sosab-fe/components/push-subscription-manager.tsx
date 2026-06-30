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

                const subscription = await registration.pushManager.getSubscription()

                if (!subscription) {
                    const newSubscription = await registration.pushManager.subscribe({
                        userVisibleOnly: true,
                        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
                    })

                    await api.post("/notifications/subscribe", newSubscription)
                    console.log("Push subscription successful")
                }
            } catch (error) {
                console.error("Failed to register push subscription:", error)
            }
        }

        registerPush()
    }, [user])

    return null
}
