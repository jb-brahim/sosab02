"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "pm" | "gerant" | "worker" | "accountant"

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | null>(null)

// DEMO_USERS removed - using real API

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Version key to force session refresh when significant changes happen
  const STORAGE_VERSION = 'v2.1-refresh';

  useEffect(() => {
    // Check for stored session
    const stored = localStorage.getItem("sosab-user")
    const storedVersion = localStorage.getItem("sosab-version")

    // Force clear if version mismatch (fixes "old design" persistence issues)
    if (stored && storedVersion !== STORAGE_VERSION) {
      console.log("Clearing stale session data...")
      localStorage.removeItem("sosab-user")
      localStorage.removeItem("sosab-version")
      setUser(null)
      setIsLoading(false)
      return
    }

    if (stored) {
      try {
        const parsed = JSON.parse(stored)

        // Normalize role if it exists
        if (parsed.role) {
          const r = parsed.role.toLowerCase();
          parsed.role = r === "admin" ? "admin" :
            (r.includes("manager") || r === "pm") ? "pm" :
              (r === "gérant" || r === "gerant") ? "gerant" :
                r === "accountant" ? "accountant" : "worker"
        }

        setUser(parsed)
      } catch {
        localStorage.removeItem("sosab-user")
      }
    }
    setIsLoading(false)
  }, [])

  // Request GPS coordinates on app startup to track actions precisely
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return
    }

    const requestGPS = () => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem("sosab-lat", position.coords.latitude.toString())
          localStorage.setItem("sosab-lon", position.coords.longitude.toString())
          console.log("✓ Exact GPS coordinates captured:", position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          console.warn("⚠ Geolocation permission denied or failed:", error.message)
        },
        { enableHighAccuracy: true, timeout: 15000 }
      )
    }

    // Try to use the Permissions API to check if permission is already granted, prompt, or denied.
    // If it's already granted, we can call it silently. If it is 'prompt', we only prompt once per session.
    if ("permissions" in navigator && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            // Already granted, query silently in background to keep coords fresh
            requestGPS()
          } else if (result.state === "prompt") {
            // Not granted yet; only prompt once per session
            const prompted = sessionStorage.getItem("sosab-gps-prompted")
            if (!prompted) {
              sessionStorage.setItem("sosab-gps-prompted", "true")
              requestGPS()
            }
          }
          // If 'denied', do not call requestGPS to avoid spamming or warnings
        })
        .catch(() => {
          // Fallback if query fails
          const prompted = sessionStorage.getItem("sosab-gps-prompted")
          if (!prompted) {
            sessionStorage.setItem("sosab-gps-prompted", "true")
            requestGPS()
          }
        })
    } else {
      // Fallback for browsers without permissions.query support
      const prompted = sessionStorage.getItem("sosab-gps-prompted")
      if (!prompted) {
        sessionStorage.setItem("sosab-gps-prompted", "true")
        requestGPS()
      }
    }
  }, [user])

  const login = async (email: string, password: string) => {
    try {
      // Dynamic import to avoid circular dependency if api uses auth-context (it doesn't yet but good practice)
      const { default: api } = await import("@/lib/api")

      const res = await api.post("/auth/login", { email, password })

      if (res.data.success) {
        // Normalize role to lowercase to match frontend expectations
        const r = res.data.user.role.toLowerCase()
        const normalizedRole = r === "admin" ? "admin" :
          (r.includes("manager") || r === "pm") ? "pm" :
            (r === "gérant" || r === "gerant") ? "gerant" :
              r === "accountant" ? "accountant" : "worker"

        const userData = {
          ...res.data.user,
          role: normalizedRole,
          token: res.data.token
        }
        setUser(userData)
        localStorage.setItem("sosab-user", JSON.stringify(userData))
        localStorage.setItem("sosab-version", "v2.1-refresh") // Use constant in real usage, but string literal is fine here for consistency with previous step context if scope allows. 
        // Better: I should use the constant if I can access it or just string match it.
        // Since STORAGE_VERSION is inside the component, I can't access it here easily in a dirty replacement without moving the constant up.
        // I will move the constant up in the next step or just duplicate the string for now.
        return // Success
      } else {
        throw new Error(res.data.message || "Login failed")
      }
    } catch (error: any) {
      console.error("Login error:", error)
      throw new Error(error.response?.data?.message || error.message || "Login failed")
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("sosab-user")
    // Optional: Call backend logout if needed
  }

  return <AuthContext.Provider value={{ user, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth must be used within AuthProvider")
  return ctx
}
