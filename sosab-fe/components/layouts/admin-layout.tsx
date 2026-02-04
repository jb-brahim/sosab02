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
  ClipboardList,
  CalendarCheck,
  Warehouse,
  ArrowRightLeft,
  Banknote,
} from "lucide-react"



const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/admin/projects", icon: FolderKanban, label: "Projects" },
  { href: "/admin/materials", icon: Package, label: "Materials" },
  { href: "/admin/workers", icon: Users, label: "Workers" },
  { href: "/admin/reports", icon: FileBarChart, label: "Reports" },
  { href: "/admin/users", icon: Users, label: "Users" },
]

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { user, logout } = useAuth()

  const handleLogout = () => {
    logout()
    router.push("/login")
  }

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch Notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/notifications/${user.id}`)
      if (res.data.success) {
        setNotifications(res.data.data)
        setUnreadCount(res.data.data.filter((n: any) => !n.read).length)
      }
    } catch (error) {
      console.error("Failed to fetch notifications", error)
    }
  }

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
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [user])


  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside
        className={cn(
          "flex flex-col border-r border-border bg-sidebar transition-all duration-300",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
          {!collapsed && (
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
                <HardHat className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-display text-xl font-bold tracking-wide">SOSAB</span>
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
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
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
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="flex h-16 items-center justify-between border-b border-border bg-card/50 backdrop-blur-sm px-6">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search projects, workers... (Press Enter)"
                className="h-10 w-72 rounded-lg border border-border bg-muted/50 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
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

          <div className="flex items-center gap-3">
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
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Notifications</span>
                  {unreadCount > 0 && (
                    <span className="text-xs text-muted-foreground cursor-pointer hover:text-primary" onClick={() => {
                      notifications.filter(n => !n.read).forEach(n => markAsRead(n._id));
                    }}>
                      Mark all as read
                    </span>
                  )}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-[70vh] overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-sm text-muted-foreground">
                      No notifications
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <DropdownMenuItem
                        key={notification._id}
                        className={cn(
                          "flex flex-col items-start gap-1 p-3 cursor-pointer",
                          !notification.read && "bg-muted/50"
                        )}
                        onClick={() => handleNotificationClick(notification)}
                      >
                        <div className="flex items-start justify-between w-full">
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
                <Button variant="ghost" className="flex items-center gap-3 px-2 hover:bg-muted">
                  <Avatar className="h-9 w-9 border-2 border-primary/20">
                    <AvatarFallback className="bg-gradient-to-br from-primary to-primary/70 text-primary-foreground font-medium">
                      {user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="text-left">
                    <p className="text-sm font-medium">{user?.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{user?.role}</p>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/admin/settings" className="w-full flex cursor-pointer items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
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
