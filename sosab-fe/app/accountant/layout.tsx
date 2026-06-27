"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { AuthGuard } from "@/components/auth/auth-guard"
import { useAuth } from "@/lib/auth-context"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Users,
  CalendarDays,
  DollarSign,
  FileBarChart,
  LogOut,
  HardHat,
  Bell,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { ThemeToggle } from "@/components/theme-toggle"
import { toast } from "sonner"

const navItems = [
  { href: "/accountant", icon: LayoutDashboard, label: "Dashboard", exact: true },
  { href: "/accountant/projects", icon: FolderKanban, label: "Mes Projets" },
  { href: "/accountant/materials", icon: Package, label: "Matériaux" },
  { href: "/accountant/attendance", icon: CalendarDays, label: "Présences" },
  { href: "/accountant/salary", icon: DollarSign, label: "Salaires" },
  { href: "/accountant/reports", icon: FileBarChart, label: "Rapports" },
]

function AccountantSidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen z-40 flex flex-col bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Logo */}
      <div className={cn("flex items-center border-b border-border/50 min-h-[64px]", collapsed ? "justify-center p-3" : "gap-3 px-4 py-5")}>
        {collapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 rounded-xl hover:bg-muted"
            onClick={onToggle}
            aria-label="Toggle sidebar"
          >
            <Menu className="h-5 w-5" />
          </Button>
        ) : (
          <>
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <HardHat className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-wide">SOSAB</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold text-amber-500">
                Comptable
              </span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="ml-auto h-7 w-7 shrink-0"
              onClick={onToggle}
              aria-label="Toggle sidebar"
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group relative",
                isActive
                  ? "bg-amber-500/10 text-amber-500 shadow-sm"
                  : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
              )}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors",
                  isActive ? "text-amber-500" : "text-muted-foreground group-hover:text-foreground"
                )}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-amber-500" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* User Profile */}
      <div className="border-t border-border/50 p-3 space-y-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-xl px-2 py-2",
            collapsed && "justify-center"
          )}
        >
          <Avatar className="h-8 w-8 shrink-0 ring-2 ring-amber-500/20">
            <AvatarFallback className="bg-amber-500/10 text-amber-600 font-bold text-xs">
              {user?.name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-semibold text-xs truncate">{user?.name}</span>
              <span className="text-[10px] text-amber-500 font-medium uppercase tracking-wider">Comptable</span>
            </div>
          )}
        </div>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "default"}
          className={cn(
            "w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl",
            collapsed ? "justify-center h-9" : "justify-start gap-3 px-3"
          )}
          onClick={handleLogout}
          title={collapsed ? "Déconnexion" : undefined}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>Déconnexion</span>}
        </Button>
      </div>
    </aside>
  )
}

export default function AccountantLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <AuthGuard allowedRoles={["accountant", "admin"]}>
      <div className="flex min-h-screen bg-background">
        <AccountantSidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        {/* Main content shifts right based on sidebar width */}
        <div
          className={cn(
            "flex-1 flex flex-col min-h-screen transition-all duration-300",
            collapsed ? "ml-16" : "ml-64"
          )}
        >
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-6">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">
                Portail Comptable
              </span>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </AuthGuard>
  )
}
