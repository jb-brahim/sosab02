"use client"

import type React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Home, Package, Plus, ClipboardList, Menu } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { ManagerNavDrawer } from "./manager-nav-drawer"

const navItems = [
  { href: "/app", icon: Home, label: "Home" },
  { href: "/app/materials", icon: Package, label: "Materials" },
  { href: "/app/scan", icon: Plus, label: "Scan", isAction: true },
  { href: "/app/menu", icon: Menu, label: "Menu" },
]

export function MobileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { user } = useAuth()
  const isPM = user?.role === "pm"

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Manager Specific Header/Drawer */}
      {isPM && <ManagerNavDrawer />}

      {/* Main Content */}
      <main className={cn("flex-1 overflow-auto bg-muted/5", !isPM && "pb-20")}>
        {children}
      </main>

      {/* Bottom Navigation - Only for non-PMs (workers) */}
      {!isPM && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-lg safe-area-pb">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.href

              if (item.isAction) {
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex -mt-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg active:scale-95 transition-transform glow-primary"
                  >
                    <item.icon className="h-6 w-6 text-primary-foreground" />
                  </Link>
                )
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex flex-col items-center gap-1 px-3 py-2 transition-colors",
                    isActive ? "text-primary" : "text-muted-foreground",
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "text-primary")} />
                  <span className="text-[10px] font-medium">{item.label}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </div>
  )
}
