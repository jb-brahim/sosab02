"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth, type UserRole } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
}

export function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const router = useRouter()
  const { user, isLoading } = useAuth()
  const isAuthenticated = !!user

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login")
    }

    if (!isLoading && isAuthenticated && allowedRoles && user) {
      if (!allowedRoles.includes(user.role)) {
        if (user.role === "admin") {
          router.push("/admin")
        } else {
          router.push("/app")
        }
      }
    }
  }, [isLoading, isAuthenticated, user, allowedRoles, router])

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return null
  }

  return <>{children}</>
}
