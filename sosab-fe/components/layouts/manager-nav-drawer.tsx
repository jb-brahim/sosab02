"use client"

import React from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import {
    FolderKanban,
    Package,
    FileBarChart,
    ClipboardList,
    LogOut,
    User,
    HardHat,
    Menu,
    Bell,
    Settings,
    Warehouse
} from "lucide-react"
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "@/components/theme-toggle"
import { LanguageSwitcher } from "@/components/language-switcher"
import { useLanguage } from "@/lib/language-context"

const managerNavItems = (t: (key: string) => string) => [
    { href: "/app", icon: FolderKanban, label: t("nav.projects") },
    { href: "/app/materials", icon: Package, label: t("nav.materials") },
    { href: "/app/daily-reports", icon: ClipboardList, label: t("nav.daily_reports") },
    { href: "/app/reports", icon: FileBarChart, label: t("nav.reports") },
    { href: "/app/stock", icon: Warehouse, label: t("nav.stock") },
]

export function ManagerNavDrawer() {
    const pathname = usePathname()
    const router = useRouter()
    const { user, logout } = useAuth()
    const { t } = useLanguage()

    const navItems = managerNavItems(t)

    const handleLogout = () => {
        logout()
        router.push("/login")
    }

    return (
        <div className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur-md">
            <div className="flex h-16 items-center justify-between px-4">
                {/* Left: Drawer Trigger */}
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
                                        <SheetTitle className="font-display text-xl font-bold tracking-tight">{t("common.sosab")}</SheetTitle>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{t("common.manager_portal")}</p>
                                    </div>
                                </div>
                            </SheetHeader>

                            {/* User Profile Summary */}
                            <div className="p-6 border-b border-border/50">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-primary/20 p-0.5">
                                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                            {user?.name?.charAt(0) || "M"}
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
                                    const isActive = pathname === item.href || (item.href !== "/app" && pathname.startsWith(item.href))
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
                                <SheetClose asChild>
                                    <Link
                                        href="/app/settings"
                                        className="flex items-center gap-4 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-all"
                                    >
                                        <Settings className="h-5 w-5" />
                                        <span>{t("common.settings")}</span>
                                    </Link>
                                </SheetClose>
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start gap-4 rounded-xl px-4 py-3 text-destructive hover:bg-destructive/10 hover:text-destructive active:scale-95 transition-all"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-5 w-5" />
                                    <span>{t("common.logout")}</span>
                                </Button>
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                {/* Center: Logo */}
                <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary shadow-sm">
                        <HardHat className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <span className="font-display text-lg font-bold">{t("common.sosab")}</span>
                </div>

                {/* Right: Language/Theme/Avatar */}
                <div className="flex items-center gap-2">
                    <LanguageSwitcher />
                    <ThemeToggle />
                    <Avatar className="h-8 w-8 ring-2 ring-primary/10">
                        <AvatarFallback className="bg-muted text-[10px] font-bold">
                            {user?.name?.charAt(0) || "M"}
                        </AvatarFallback>
                    </Avatar>
                </div>
            </div>
        </div>
    )
}
