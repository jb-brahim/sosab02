"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    FolderKanban,
    FileBarChart,
    LogOut,
    HardHat,
    Menu,
    Settings,
    ChevronLeft,
    Bell,
    Package,
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
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"
import api from "@/lib/api"

const gerantNavItems = (t: (key: string) => string) => [
    { href: "/gerant", icon: FolderKanban, label: t("nav.projects") === "nav.projects" ? "Chantier" : (t("nav.projects") === "Projets" ? "Chantier" : t("nav.projects")) || "Chantier" },
    { href: "/gerant/materials", icon: Package, label: "Materils" },
    { href: "/gerant/reports", icon: FileBarChart, label: t("nav.reports") || "Reports" },
]

export function GerantNavDrawer() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()
    const { t } = useLanguage()

    const navItems = gerantNavItems(t)

    // Show back button on any page that is NOT a top-level nav destination
    const topLevelRoutes = ["/gerant", "/gerant/reports", "/gerant/settings"]
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

    // Mark as read and navigate
    const handleNotificationClick = async (notification: any) => {
        if (!notification.read) {
            await markAsRead(notification._id)
        }
        if (notification.link) {
            // Adjust link for Gérant if necessary, though most /admin links are fine if Gérant has access
            router.push(notification.link)
        }
    }

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

    const markAllAsRead = async () => {
        const unread = notifications.filter(n => !n.read)
        if (unread.length === 0) return

        try {
            // Sequential mark as read (simple approach)
            await Promise.all(unread.map(n => api.patch(`/notifications/${n._id}/read`)))
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
        } catch (error) {
            console.error("Failed to mark all as read", error)
        }
    }

    // Poll for notifications every 30 seconds
    React.useEffect(() => {
        if (!user?.id) return

        const controller = new AbortController()
        fetchNotifications(controller.signal)

        const interval = setInterval(() => fetchNotifications(controller.signal), 30000)

        return () => {
            controller.abort()
            clearInterval(interval)
        }
    }, [user?.id, fetchNotifications])

    return (
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4">
                {/* Left: Back button (sub-pages) OR Drawer (top-level) */}
                <div className="flex items-center gap-1">
                    {showBack && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.back()}
                            className="text-muted-foreground hover:text-foreground"
                            aria-label="Go back"
                        >
                            <ChevronLeft className="h-6 w-6" />
                        </Button>
                    )}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[80%] max-w-[300px] p-0 border-r-0">
                            <div className="flex bg-gradient-to-b from-card to-background flex-col h-full shadow-2xl">
                                <SheetHeader className="p-6 border-b border-border/50 bg-primary/5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                                            <HardHat className="h-6 w-6 text-primary-foreground" />
                                        </div>
                                        <div className="text-left">
                                            <SheetTitle className="font-display text-xl font-bold tracking-tight">{t("common.sosab") || "SOSAB"}</SheetTitle>
                                            <SheetDescription className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                                                {t("nav.gerant_portal") || "PORTAIL GÉRANT"}
                                            </SheetDescription>
                                        </div>
                                    </div>
                                </SheetHeader>

                                {/* User Profile Summary */}
                                <div className="p-6 border-b border-border/50">
                                    <div className="flex items-center gap-4">
                                        <Avatar className="h-12 w-12 border-2 border-primary/20 p-0.5">
                                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                                {user?.name?.charAt(0) || "G"}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-foreground">{user?.name}</span>
                                            <span className="text-xs text-muted-foreground truncate max-w-[150px]">{user?.email}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Navigation Links */}
                                <nav className="flex-1 px-4 py-8 space-y-2">
                                    {navItems.map((item) => {
                                        const isActive = pathname === item.href || (item.href !== "/gerant" && pathname.startsWith(item.href))
                                        return (
                                            <SheetClose asChild key={item.href}>
                                                <Link
                                                    href={item.href}
                                                    className={cn(
                                                        "flex items-center gap-4 rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200",
                                                        isActive
                                                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20 scale-[1.02]"
                                                            : "text-muted-foreground hover:bg-muted/50 hover:text-foreground active:scale-95"
                                                    )}
                                                >
                                                    <item.icon className={cn("h-5 w-5", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                                                    <span>{item.label}</span>
                                                </Link>
                                            </SheetClose>
                                        )
                                    })}
                                </nav>

                                {/* Bottom Actions */}
                                <div className="p-4 border-t border-border/50 space-y-2">
                                    {/* <SheetClose asChild>
                                        <Link
                                            href="/gerant/settings"
                                            className="flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-all"
                                        >
                                            <Settings className="h-5 w-5" />
                                            <span>{t("common.settings") || "Settings"}</span>
                                        </Link>
                                    </SheetClose> */}
                                    <Button
                                        variant="ghost"
                                        className="w-full justify-start gap-4 rounded-xl px-4 py-3 text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
                                        onClick={handleLogout}
                                    >
                                        <LogOut className="h-5 w-5" />
                                        <span>{t("common.logout") || "Logout"}</span>
                                    </Button>
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Center: Logo */}
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                        <HardHat className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-display text-lg font-bold">{t("common.sosab") || "SOSAB"}</span>
                </div>

                {/* Right: Language/Theme/Avatar */}
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="relative hover:bg-muted rounded-xl">
                                <Bell className="h-5 w-5 text-muted-foreground" />
                                {unreadCount > 0 && (
                                    <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground shadow-lg animate-in zoom-in">
                                        {unreadCount}
                                    </span>
                                )}
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[300px] mt-2 rounded-2xl p-0 overflow-hidden glass shadow-2xl border-white/10">
                            <DropdownMenuLabel className="flex items-center justify-between p-4 bg-muted/30">
                                <span className="text-sm font-bold uppercase tracking-wider">{t("common.notifications") || "Notifications"}</span>
                                {unreadCount > 0 && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={markAllAsRead}
                                        className="h-7 text-[10px] font-bold text-primary hover:text-primary hover:bg-primary/5 uppercase tracking-tighter"
                                    >
                                        {t("common.mark_all_read") || "Read all"}
                                    </Button>
                                )}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="m-0 bg-white/5" />
                            <div className="max-h-[60vh] overflow-y-auto">
                                {notifications.length === 0 ? (
                                    <div className="py-12 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
                                        <Bell className="h-8 w-8 opacity-10" />
                                        <span>{t("common.no_notifications") || "No notifications"}</span>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((notification) => (
                                            <DropdownMenuItem
                                                key={notification._id}
                                                className={cn(
                                                    "flex flex-col items-start gap-1 p-4 cursor-pointer focus:bg-muted/50 transition-colors relative",
                                                    !notification.read && "bg-primary/5"
                                                )}
                                                onClick={() => handleNotificationClick(notification)}
                                            >
                                                {!notification.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary" />}
                                                <div className="flex items-start justify-between w-full gap-2">
                                                    <span className={cn("text-xs leading-relaxed", !notification.read ? "font-bold text-foreground" : "text-muted-foreground")}>
                                                        {notification.message}
                                                    </span>
                                                </div>
                                                <div className="flex items-center justify-between w-full mt-1">
                                                    <span className="text-[9px] font-bold uppercase tracking-widest text-primary/60">
                                                        {notification.type}
                                                    </span>
                                                    <span className="text-[9px] text-muted-foreground font-medium">
                                                        {new Date(notification.createdAt).toLocaleDateString()}
                                                    </span>
                                                </div>
                                            </DropdownMenuItem>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                        <AvatarFallback className="bg-muted text-[10px] font-bold">
                            {user?.name?.charAt(0) || "G"}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    )
}
