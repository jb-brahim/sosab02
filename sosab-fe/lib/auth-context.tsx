"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

export type UserRole = "admin" | "pm" | "gerant" | "worker" | "accountant"

export interface User {
  id: string
  _id?: string
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

const STORAGE_VERSION = 'v2.5-owner-superadmin'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for stored session
    const stored = localStorage.getItem("sosab-user")
    const storedVersion = localStorage.getItem("sosab-version")

    // Ensure session version is set
    if (stored && !storedVersion) {
      localStorage.setItem("sosab-version", STORAGE_VERSION)
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

  // Request fresh live GPS coordinates silently on app startup
  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) {
      return
    }

    const captureFreshLocation = (highAccuracy = false) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          localStorage.setItem("sosab-lat", position.coords.latitude.toString())
          localStorage.setItem("sosab-lon", position.coords.longitude.toString())
          localStorage.setItem("sosab-gps-time", Date.now().toString())
          localStorage.removeItem("sosab-gps-denied")
          console.log("✓ Fresh live GPS location updated:", position.coords.latitude, position.coords.longitude)
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            localStorage.setItem("sosab-gps-denied", "true")
          }
          console.warn("⚠ Geolocation failed:", error.message)
        },
        { enableHighAccuracy: highAccuracy, timeout: 10000, maximumAge: 0 }
      )
    }

    // Check permission state via Permissions API
    if ("permissions" in navigator && navigator.permissions.query) {
      navigator.permissions.query({ name: "geolocation" as PermissionName })
        .then((result) => {
          if (result.state === "granted") {
            // Already accepted by user! Fetch fresh live position 100% SILENTLY (no popup ever!)
            captureFreshLocation(true)
          } else if (result.state === "prompt") {
            // Not accepted yet; ask once
            const prompted = sessionStorage.getItem("sosab-gps-prompted")
            if (!prompted) {
              sessionStorage.setItem("sosab-gps-prompted", "true")
              captureFreshLocation(false)
            }
          }
        })
        .catch(() => {
          captureFreshLocation(false)
        })
    } else {
      captureFreshLocation(false)
    }
  }, [])

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
        localStorage.setItem("sosab-version", STORAGE_VERSION)
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
