"use client"

import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { User, Settings, Bell, HelpCircle, FileText, LogOut, ChevronRight } from "lucide-react"

const menuItems = [
  { icon: User, label: "Profile", href: "/app/profile" },
  { icon: Settings, label: "Settings", href: "/app/settings" },
  { icon: Bell, label: "Notifications", href: "/app/notifications" },
  { icon: FileText, label: "Reports", href: "/app/reports" },
  { icon: HelpCircle, label: "Help & Support", href: "/app/help" },
]

export default function MenuPage() {
  const router = useRouter()
  const { user, logout } = useAuthStore()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <div className="space-y-6 p-4">
      {/* Profile Card */}
      <Card className="border-border bg-card">
        <CardContent className="flex items-center gap-4 p-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-xl text-primary-foreground">
              {user?.name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="font-display text-xl font-bold">{user?.name}</h2>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <p className="text-xs capitalize text-primary">{user?.role}</p>
          </div>
        </CardContent>
      </Card>

      {/* Menu Items */}
      <div className="space-y-2">
        {menuItems.map((item) => (
          <Card
            key={item.label}
            className="border-border bg-card transition-all active:scale-[0.99] cursor-pointer"
            onClick={() => router.push(item.href)}
          >
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                  <item.icon className="h-5 w-5 text-foreground" />
                </div>
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Logout */}
      <Card
        className="border-destructive/30 bg-destructive/5 transition-all active:scale-[0.99]"
        onClick={handleLogout}
      >
        <CardContent className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/20">
            <LogOut className="h-5 w-5 text-destructive" />
          </div>
          <span className="font-medium text-destructive">Logout</span>
        </CardContent>
      </Card>
    </div>
  )
}
