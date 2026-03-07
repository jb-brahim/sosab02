"use client"

import React from "react"

import { useState } from "react"
import Link from "next/link"

import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { ThemeToggle } from "@/components/theme-toggle"
import { useLanguage } from "@/lib/language-context"
import {
  LayoutDashboard,
  FolderKanban,
  Package,
  Users,
  FileBarChart,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  Search,
  HardHat,
} from "lucide-react"

const adminNavItems = (t: (key: string) => string) => [
  { href: "/admin", icon: LayoutDashboard, label: t("nav.home") || "Dashboard" },
  { href: "/admin/projects", icon: FolderKanban, label: t("nav.projects") || "Projects" },
  { href: "/admin/materials", icon: Package, label: t("nav.materials") || "Materials" },
  { href: "/admin/workers", icon: Users, label: t("nav.workers") || "Workers" },
  { href: "/admin/reports", icon: FileBarChart, label: t("nav.reports") || "Reports" },
  { href: "/admin/users", icon: Users, label: t("nav.users") || "Users" },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()
  const { t, language } = useLanguage()
  const isRTL = language === "ar"

  const navItems = adminNavItems(t)

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch Notifications
  const fetchNotifications = React.useCallback(async (signal?: AbortSignal) => {
    if (!user?.id) return;
    try {
      const res = await api.get(`/notifications/${user.id}`, { signal })
      if (res.data.success) {
        setNotifications(res.data.data)
        setUnreadCount(res.data.data.filter((n: any) => !n.read).length)
      }
    } catch (error: any) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return
      console.error("Failed to fetch notifications", error)
    }
  }, [user?.id])

  // Mark as read and navigate
  const handleNotificationClick = async (notification: any) => {
    if (!notification.read) {
      await markAsRead(notification._id)
    }
    if (notification.link) {
      router.push(notification.link)
    }
  }

  const markAsRead = async (id: string) => {
    try {
      const res = await api.patch(`/notifications/${id}/read`)
      if (res.data.success) {
        // Update local state
        setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
        setUnreadCount(prev => Math.max(0, prev - 1))
      }
    } catch (error) {
      console.error("Failed to mark notification as read", error)
    }
  }

  // Poll for notifications every 30 seconds
  React.useEffect(() => {
    const controller = new AbortController()
    fetchNotifications(controller.signal)
    const interval = setInterval(() => fetchNotifications(controller.signal), 30000)
    return () => {
      controller.abort()
      clearInterval(interval)
    }
  }, [fetchNotifications])


  return (
    <div className={cn("flex h-screen bg-background", isRTL && "flex-row-reverse")}>
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-border bg-sidebar transition-all duration-300",
          isRTL ? "border-l" : "border-r",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
                <HardHat className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold tracking-wide">{t("common.sosab") || "SOSAB"}</span>
            </div>
          )}
          {collapsed && (
            <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
              <HardHat className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all text-left",
                  isRTL && "flex-row-reverse text-right",
                  "hover:bg-sidebar-accent active:scale-[0.98]",
                  isActive
                    ? "bg-primary/15 text-primary shadow-sm shadow-primary/10"
                    : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
                )}
              >
                <item.icon className={cn("h-5 w-5 shrink-0", isActive && "text-primary")} />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Collapse Button */}
        <div className="border-t border-sidebar-border p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="w-full justify-center hover:bg-sidebar-accent"
          >
            {collapsed ? (isRTL ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />) : (isRTL ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />)}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className={cn("flex h-16 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-6", isRTL && "flex-row-reverse")}>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className={cn("absolute top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
              <input
                type="text"
                placeholder={t("common.search") || "Search projects, workers..."}
                dir={isRTL ? "rtl" : "ltr"}
                className={cn(
                  "h-10 w-72 rounded-lg border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all",
                  isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
                )}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = (e.target as HTMLInputElement).value
                    if (val.trim()) {
                      router.push(`/admin/search?q=${encodeURIComponent(val)}`)
                    }
                  }
                }}
              />
            </div>
          </div>

          <div className={cn("flex items-center gap-3", isRTL && "flex-row-reverse")}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-muted">
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground shadow-lg">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-80">
                <DropdownMenuLabel className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                  <span>{t("common.notifications") || "Notifications"}</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary" onClick={() => {
                      notifications.filter(n => !n.read).forEach(n => markAsRead(n._id));
                    }}>
                      {t("common.mark_all_read") || "Mark all as read"}
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[70vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      {t("common.no_notifications") || "No notifications"}
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification._id}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 cursor-pointer",
                          isRTL && "items-end text-right",
                          !notification.read && "bg-muted/50"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className={cn("flex items-start justify-between w-full", isRTL && "flex-row-reverse")}>
                          <span className="font-medium text-sm">{notification.message}</span>
                          <span className="text-[10px] text-muted-foreground ml-2 whitespace-nowrap">
                            {new Date(notification.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {notification.type}
                        </span>
                      </DropdownMenuItem>
                    ))
                  )}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <ThemeToggle />

            <div className="h-6 w-px bg-border" />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className={cn("flex items-center gap-3 px-2 hover:bg-muted", isRTL && "flex-row-reverse")}>
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-medium">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn("text-left", isRTL && "text-right")}>
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align={isRTL ? "start" : "end"} className="w-56">
                <DropdownMenuLabel className={isRTL ? "text-right" : ""}>{isRTL ? "حسابي" : "My Account"}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className={cn("w-full flex cursor-pointer items-center", isRTL && "flex-row-reverse")}>
                    <Settings className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {t("common.settings") || "Settings"}
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className={cn("text-destructive focus:text-destructive flex items-center", isRTL && "flex-row-reverse")}>
                  <LogOut className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t("common.logout") || "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
