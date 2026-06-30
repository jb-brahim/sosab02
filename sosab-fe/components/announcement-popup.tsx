"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { Megaphone, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function AnnouncementPopup() {
  const { user } = useAuth()
  const [activeAnnouncements, setActiveAnnouncements] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState<number>(0)
  const [open, setOpen] = useState(false)

  const fetchAnnouncements = async () => {
    // Admins don't need to see the announcement popups (they create them)
    if (!user || user.role?.toLowerCase() === "admin") {
      return
    }

    try {
      const res = await api.get("/announcements")
      if (res.data.success && res.data.data.length > 0) {
        setActiveAnnouncements(res.data.data)
        setCurrentIndex(0)
        setOpen(true)
      }
    } catch (err) {
      console.error("Failed to fetch announcements for popup:", err)
    }
  }

  useEffect(() => {
    if (user) {
      // Delay slightly to allow the page to render first
      const timer = setTimeout(() => {
        fetchAnnouncements()
      }, 1500)
      return () => clearTimeout(timer)
    } else {
      setOpen(false)
      setActiveAnnouncements([])
    }
  }, [user])

  const handleDismiss = async () => {
    if (activeAnnouncements.length === 0) return

    const currentAnn = activeAnnouncements[currentIndex]
    try {
      // Optimistically dismiss in UI
      await api.post(`/announcements/${currentAnn._id}/dismiss`)
    } catch (err) {
      console.error("Failed to dismiss announcement:", err)
    }

    // Move to next announcement or close
    if (currentIndex + 1 < activeAnnouncements.length) {
      setCurrentIndex(currentIndex + 1)
    } else {
      setOpen(false)
      setActiveAnnouncements([])
    }
  }

  if (!open || activeAnnouncements.length === 0) return null

  const announcement = activeAnnouncements[currentIndex]

  return (
    <div className="fixed inset-0 bg-background/85 backdrop-blur-md z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card/90 border border-border/50 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-300 relative overflow-hidden">
        {/* Top decorative glow */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Megaphone icon header */}
        <div className="flex flex-col items-center text-center space-y-2">
          <div className="h-14 w-14 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-inner relative">
            <Megaphone className="h-6 w-6 animate-bounce" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
            </span>
          </div>
          <span className="text-[10px] font-bold text-primary uppercase tracking-widest bg-primary/5 px-2.5 py-0.5 rounded-full">
            Nouvelle Annonce
          </span>
        </div>

        {/* Title & Content */}
        <div className="space-y-2 text-center">
          <h2 className="text-lg font-black tracking-tight text-foreground/90 leading-snug">
            {announcement.title}
          </h2>
          <div className="max-h-[200px] overflow-y-auto text-xs text-foreground/80 leading-relaxed bg-muted/30 border border-border/30 p-4 rounded-2xl text-left whitespace-pre-wrap">
            {announcement.content}
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={handleDismiss}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl h-11 gap-2 text-xs transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
        >
          <CheckCircle2 className="w-4 h-4" />
          J'ai compris
        </Button>

        {/* Pagination indicator if multiple */}
        {activeAnnouncements.length > 1 && (
          <p className="text-[9px] text-muted-foreground text-center font-bold">
            Annonce {currentIndex + 1} sur {activeAnnouncements.length}
          </p>
        )}
      </div>
    </div>
  )
}
