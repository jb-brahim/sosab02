"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Loader2 } from "lucide-react"

export default function Home() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/login")
      } else if (user.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/app")
      }
    }
  }, [isLoading, user, router])

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
          <Loader2 className="relative h-10 w-10 animate-spin text-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Loading SOSAB Tracker...</p>
      </div>
    </div>
  )
}
