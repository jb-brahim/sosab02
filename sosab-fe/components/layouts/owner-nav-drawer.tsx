"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    FolderKanban,
    FileText,
    LogOut,
    HardHat,
    Menu,
    ChevronLeft,
    Bell,
    Package,
    Shield,
    Users,
    Activity,
    Check
} from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
    SheetTrigger,
    SheetClose,
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
import { useLanguage } from "@/lib/language-context"
import api from "@/lib/api"

const ownerNavItems = (t: (key: string) => string) => [
    { href: "/owner", icon: FolderKanban, label: "Tableau de Bord" },
    { href: "/owner/managers", icon: Users, label: "Gestion Managers" },
    { href: "/owner/logs", icon: Activity, label: "Journal d'Activité" },
    { href: "/owner/reports", icon: FileText, label: "Génération Rapports" },
]

export function OwnerNavDrawer() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()
    const { t } = useLanguage()

    const navItems = ownerNavItems(t)

    // Show back button on any page that is NOT a top-level nav destination
    const topLevelRoutes = ["/owner", "/owner/managers", "/owner/logs", "/owner/reports"]
    const showBack = !topLevelRoutes.includes(pathname)

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    // Notification State
    const [notifications, setNotifications] = React.useState<any[]>([])
    const [unreadCount, setUnreadCount] = React.useState(0)

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

    const markAsRead = async (id: string) => {
        try {
            const res = await api.patch(`/notifications/${id}/read`)
            if (res.data.success) {
                setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n))
                setUnreadCount(prev => Math.max(0, prev - 1))
            }
        } catch (error) {
            console.error("Failed to mark notification as read", error)
        }
    }

    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification._id)
        }
        if (notification.link) {
            router.push(notification.link)
        }
    }

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
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-md px-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-2">
                {showBack ? (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9 -ml-2 rounded-xl"
                        onClick={() => router.back()}
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                ) : (
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-9 w-9 -ml-2 rounded-xl">
                                <Menu className="h-5 w-5" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-80 p-0 border-r border-border bg-card">
                            <div className="flex flex-col h-full">
                                {/* Header */}
                                <div className="flex items-center gap-3 px-6 py-5 border-b border-border/50">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                                        <Shield className="h-5 w-5" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-sm tracking-wide">SOSAB</span>
                                        <span className="text-[10px] text-primary font-bold uppercase tracking-wider">
                                            Super Admin (Owner)
                                        </span>
                                    </div>
                                </div>

                                {/* Nav Links */}
                                <nav className="flex-1 px-4 py-6 space-y-1.5">
                                    {navItems.map((item) => {
                                        const isActive = item.href === "/owner"
                                            ? pathname === item.href
                                            : pathname.startsWith(item.href)

                                        return (
                                            <SheetClose asChild key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center gap-3.5 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
                                                        isActive
                                                            ? "bg-primary/10 text-primary font-semibold"
                                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                                                    )}
                                                >
                                                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SheetClose>
                                        )
                                    })}
                                </nav>

                                {/* Footer Profile info */}
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
                                        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive rounded-xl justify-start gap-3.5 px-4 h-11"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-4.5 w-4.5" />
                                        <span className="text-sm font-medium">Déconnexion</span>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                )}
                <span className="font-bold text-sm tracking-wide flex items-center gap-1.5">
                    {!showBack && <HardHat className="h-4.5 w-4.5 text-primary" />}
                    {showBack ? "Retour" : "Portail Super Admin"}
                </span>
            </div>

            <div className="flex items-center gap-2">
                <ThemeToggle />

                {/* Notifications Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl relative hover:bg-muted">
                            <Bell className="h-4.5 w-4.5 text-muted-foreground" />
                            {unreadCount > 0 && (
                                <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground shadow-lg">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1 bg-card/95 backdrop-blur-xl border-border/50">
                        <DropdownMenuLabel className="flex items-center justify-between px-3 py-2 text-xs text-muted-foreground uppercase font-bold tracking-wider">
                            <span>Notifications</span>
                            {unreadCount > 0 && (
                                <span className="text-[10px] text-primary cursor-pointer hover:underline" onClick={() => {
                                    notifications.filter(n => !n.read).forEach(n => markAsRead(n._id));
                                }}>
                                    Tout marquer lu
                                </span>
                            )}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-border/50" />
                        <div className="max-h-[300px] overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="py-8 text-center text-xs text-muted-foreground">
                                    Aucune notification
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <DropdownMenuItem
                                        key={notification._id}
                                        className={cn(
                                            "flex flex-col items-start gap-1 p-3 cursor-pointer rounded-xl transition-all m-1 focus:bg-muted/50",
                                            !notification.read && "bg-primary/5 hover:bg-primary/10"
                                        )}
                                        onClick={() => handleNotificationClick(notification)}
                                    >
                                        <span className="font-semibold text-xs text-foreground/90">{notification.message}</span>
                                        <span className="text-[9px] text-muted-foreground">{new Date(notification.createdAt).toLocaleDateString()}</span>
                                    </DropdownMenuItem>
                                ))
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
