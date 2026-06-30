"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    FolderKanban,
    FileText,
    LogOut,
    Menu,
    ChevronLeft,
    ChevronRight,
    Bell,
    Shield,
    Users,
    Activity,
    HardHat,
    DollarSign,
    Boxes,
    FileCheck,
    ClipboardList,
    UserX,
    Check
} from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import api from "@/lib/api"

const ownerNavItems = [
    { href: "/owner", icon: FolderKanban, label: "Tableau de Bord" },
    { href: "/owner/managers", icon: Users, label: "Gestion Managers" },
    { href: "/owner/logs", icon: Activity, label: "Journal d'Activité" },
    { href: "/owner/reports", icon: FileText, label: "Génération Rapports" },
]

// ── Notification helpers ──────────────────────────────────────────────────────
const getNotificationIcon = (type: string) => {
  switch (type) {
    case "material":
      return {
        icon: <Boxes className="h-4 w-4" />,
        bg: "bg-amber-500/10 text-amber-500 border border-amber-500/20"
      }
    case "report":
      return {
        icon: <FileCheck className="h-4 w-4" />,
        bg: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
      }
    case "salary":
      return {
        icon: <DollarSign className="h-4 w-4" />,
        bg: "bg-green-500/10 text-green-500 border border-green-500/20"
      }
    case "task":
      return {
        icon: <ClipboardList className="h-4 w-4" />,
        bg: "bg-violet-500/10 text-violet-500 border border-violet-500/20"
      }
    case "attendance":
      return {
        icon: <UserX className="h-4 w-4" />,
        bg: "bg-red-500/10 text-red-500 border border-red-500/20"
      }
    case "system":
      return {
        icon: <Shield className="h-4 w-4" />,
        bg: "bg-blue-500/10 text-blue-500 border border-blue-500/20"
      }
    default:
      return {
        icon: <Bell className="h-4 w-4" />,
        bg: "bg-primary/10 text-primary border border-primary/20"
      }
  }
}

const formatRelativeTime = (dateString: string) => {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return "À l'instant"
    if (diffMins < 60) return `Il y a ${diffMins} min`
    if (diffHours < 24) return `Il y a ${diffHours} h`
    if (diffDays === 1) return "Hier"
    if (diffDays < 7) return `Il y a ${diffDays} j`
    
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
  } catch {
    return ""
  }
}

// ── Shared notifications hook ────────────────────────────────────────────────
function useNotifications(userId?: string) {
    const [notifications, setNotifications] = React.useState<any[]>([])
    const [unreadCount, setUnreadCount] = React.useState(0)

    const fetchNotifications = React.useCallback(async (signal?: AbortSignal) => {
        if (!userId) return
        try {
            const res = await api.get(`/notifications/${userId}`, { signal })
            if (res.data.success) {
                setNotifications(res.data.data)
                setUnreadCount(res.data.data.filter((n: any) => !n.read).length)
            }
        } catch {}
    }, [userId])

    const markAsRead = async (id: string) => {
        try {
            const res = await api.patch(`/notifications/${id}/read`)
            if (res.data.success) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch {}
    }

    React.useEffect(() => {
        const controller = new AbortController()
        fetchNotifications(controller.signal)
        const interval = setInterval(() => fetchNotifications(controller.signal), 10000)
        return () => { controller.abort(); clearInterval(interval) }
    }, [fetchNotifications])

    return { notifications, unreadCount, markAsRead }
}

// ── Notifications dropdown ────────────────────────────────────────────────────
function NotificationsDropdown() {
    const { user } = useAuth()
    const router = useRouter()
    const { notifications, unreadCount, markAsRead } = useNotifications(user?.id)

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl relative hover:bg-muted">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    {unreadCount > 0 && (
                        <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-lg">
                            {unreadCount}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 sm:w-[360px] rounded-2xl p-1.5 bg-card/95 backdrop-blur-xl border-border/50 shadow-2xl">
                <DropdownMenuLabel className="flex items-center justify-between px-3 py-2.5 text-xs text-muted-foreground font-bold tracking-wide border-b border-border/20 mb-1">
                    <div className="flex items-center gap-1.5">
                        <Bell className="h-4 w-4 text-primary" />
                        <span className="text-foreground font-extrabold text-sm">Notifications</span>
                        {unreadCount > 0 && (
                            <span className="bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-full font-black">
                                {unreadCount} new
                            </span>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            className="text-[10px] text-primary hover:text-primary/80 transition-colors font-bold flex items-center gap-1 cursor-pointer"
                            onClick={() => notifications.filter(n => !n.read).forEach(n => markAsRead(n._id))}
                        >
                            <Check className="h-3 w-3" />
                            Tout marquer comme lu
                        </button>
                    )}
                </DropdownMenuLabel>
                <div className="max-h-[380px] overflow-y-auto space-y-0.5">
                    {notifications.length === 0 ? (
                        <div className="py-12 px-4 text-center flex flex-col items-center justify-center space-y-3">
                            <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center text-muted-foreground/60 border border-dashed border-border">
                                <Bell className="h-5 w-5" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground/80">Aucune notification</p>
                                <p className="text-[10px] text-muted-foreground max-w-[200px]">
                                    Vous êtes à jour ! Toutes les nouvelles activités apparaîtront ici.
                                </p>
                            </div>
                        </div>
                    ) : (
                        notifications.map((n: any) => (
                            <DropdownMenuItem
                                key={n._id}
                                className={cn(
                                    "flex items-start gap-3 p-3.5 cursor-pointer rounded-xl transition-all m-1 focus:bg-muted/50 relative border-l-2",
                                    n.read 
                                      ? "border-transparent opacity-75 hover:opacity-100" 
                                      : "border-primary bg-primary/5 hover:bg-primary/10 font-medium"
                                )}
                                onClick={async () => {
                                    if (!n.read) await markAsRead(n._id)
                                    if (n.link) router.push(n.link)
                                }}
                            >
                                {/* Left Side: Icon */}
                                <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm", getNotificationIcon(n.type).bg)}>
                                    {getNotificationIcon(n.type).icon}
                                </div>

                                {/* Right Side: Content */}
                                <div className="flex-1 min-w-0 space-y-1 pr-2">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                            {n.title || "Notification"}
                                        </span>
                                        <span className="text-[9px] text-muted-foreground shrink-0 font-medium">
                                            {formatRelativeTime(n.createdAt)}
                                        </span>
                                    </div>
                                    <p className="text-xs text-foreground/90 leading-normal break-words">
                                        {n.message}
                                    </p>
                                </div>

                                {/* Unread indicator dot */}
                                {!n.read && (
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-primary animate-pulse shadow-md shadow-primary/30" />
                                )}
                            </DropdownMenuItem>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}

// ── Sidebar (desktop persistent, hidden on mobile) ────────────────────────────
export function OwnerSidebar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()
    const [collapsed, setCollapsed] = useState(false)

    const handleLogout = () => { logout(); router.push("/login") }

    return (
        <aside
            className={cn(
                "hidden lg:flex flex-col h-full border-r border-border bg-card/50 backdrop-blur-sm shrink-0 transition-all duration-300 relative",
                collapsed ? "w-[68px]" : "w-[240px]"
            )}
        >
            {/* Logo */}
            <div className="flex items-center gap-3 px-4 h-14 border-b border-border/50 overflow-hidden">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                    <Shield className="h-4 w-4" />
                </div>
                {!collapsed && (
                    <div className="flex flex-col overflow-hidden">
                        <span className="font-bold text-sm tracking-wide leading-none">SOSAB</span>
                        <span className="text-[9px] text-primary font-bold uppercase tracking-wider mt-0.5">Super Admin</span>
                    </div>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-5 space-y-1">
                {ownerNavItems.map((item) => {
                    const isActive = item.href === "/owner" ? pathname === item.href : pathname.startsWith(item.href)
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={collapsed ? item.label : undefined}
                            className={cn(
                                "flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                collapsed ? "justify-center gap-0" : "gap-3.5",
                                isActive
                                    ? "bg-primary/10 text-primary font-semibold"
                                    : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    )
                })}
            </nav>

            {/* Footer */}
            <div className="border-t border-border/50 p-3 space-y-2">
                <div className={cn("flex items-center gap-3 px-1 py-1", collapsed && "justify-center")}>
                    <Avatar className="h-8 w-8 shrink-0 ring-2 ring-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">
                            {user?.name?.charAt(0) || "S"}
                        </AvatarFallback>
                    </Avatar>
                    {!collapsed && (
                        <div className="flex flex-col min-w-0">
                            <span className="font-bold text-xs truncate text-foreground/90">{user?.name || "Propriétaire"}</span>
                            <span className="text-[9px] text-primary font-medium uppercase tracking-wider">Directeur</span>
                        </div>
                    )}
                </div>
                <Button
                    variant="ghost"
                    title={collapsed ? "Déconnexion" : undefined}
                    className={cn(
                        "w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl gap-3 h-9 text-sm font-medium",
                        collapsed ? "justify-center px-0" : "justify-start px-3"
                    )}
                    onClick={handleLogout}
                >
                    <LogOut className="h-4 w-4 shrink-0" />
                    {!collapsed && <span>Déconnexion</span>}
                </Button>
            </div>

            {/* Collapse toggle */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3.5 top-[54px] h-7 w-7 rounded-full border border-border bg-card shadow-sm hover:bg-muted z-10"
            >
                {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>
        </aside>
    )
}

// ── Topbar (sticky header with mobile menu trigger + notifications) ─────────
export function OwnerTopbar() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()

    const handleLogout = () => { logout(); router.push("/login") }

    return (
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 lg:px-6 shrink-0">
            <div className="flex items-center gap-3">
                {/* Mobile hamburger */}
                <div className="lg:hidden">
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 rounded-xl">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-72 p-0 border-r border-border bg-card">
                            <SheetHeader className="sr-only">
                                <SheetTitle>Menu de navigation</SheetTitle>
                                <SheetDescription>Navigation principale du portail propriétaire</SheetDescription>
                            </SheetHeader>
                            <div className="flex flex-col h-full">
                                <div className="flex items-center gap-3 px-5 py-5 border-b border-border/50">
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-wide">SOSAB</span>
                                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">Super Admin (Owner)</span>
                                    </div>
                                </div>
                                <nav className="flex-1 px-3 py-5 space-y-1">
                                    {ownerNavItems.map((item) => {
                                        const isActive = item.href === "/owner" ? pathname === item.href : pathname.startsWith(item.href)
                                        return (
                                            <Link
                                                key={item.href}
                                                href={item.href}
                                                className={cn(
                                                    "flex items-center gap-3.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                                                    isActive
                                                        ? "bg-primary/10 text-primary font-semibold"
                                                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                )}
                                            >
                                                <item.icon className={cn("h-5 w-5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />
                                                <span>{item.label}</span>
                                            </Link>
                                        )
                                    })}
                                </nav>
                                <div className="border-t border-border/50 p-4 space-y-3">
                                    <div className="flex items-center gap-3 px-2 py-1">
                                        <Avatar className="h-9 w-9 ring-2 ring-primary/20">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                                {user?.name?.charAt(0) || "S"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col min-w-0">
                                            <span className="font-bold text-xs truncate text-foreground/90">{user?.name || "Propriétaire"}</span>
                                            <span className="text-[9px] text-primary font-medium uppercase tracking-wider">Directeur</span>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl justify-start gap-3 px-3 h-11"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span className="text-sm font-medium">Déconnexion</span>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                <span className="font-semibold text-sm text-muted-foreground tracking-wide flex items-center gap-2">
                    <HardHat className="h-4 w-4 text-primary lg:hidden" />
                    <span className="hidden lg:inline">Portail Super Admin (Owner)</span>
                    <span className="lg:hidden">Portail Super Admin</span>
                </span>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />
                <NotificationsDropdown />
            </div>
        </header>
    )
}

// ── Legacy export kept for backward-compatibility ────────────────────────────
export { OwnerTopbar as OwnerNavDrawer }
