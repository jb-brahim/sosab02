"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { GerantNavDrawer } from "@/components/layouts/gerant-nav-drawer"

export default function GerantLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <AuthGuard allowedRoles={["admin", "gerant"]}>
            <div className="flex min-h-screen flex-col bg-background">
                <GerantNavDrawer />
                <main className="flex-1 w-full max-w-md mx-auto relative">{children}</main>
            </div>
        </AuthGuard>
    )
}
