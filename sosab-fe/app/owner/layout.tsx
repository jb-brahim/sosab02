"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { OwnerNavDrawer } from "@/components/layouts/owner-nav-drawer"
import { useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { useRouter } from "next/navigation"

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const { user, isLoading } = useAuth()
    const router = useRouter()

    useEffect(() => {
        if (!isLoading && user) {
            // Extra security check: enforce that only owner email prefix can access
            if (user.role !== "admin" || (user.email !== "owner@company.com" && !user.email.startsWith("owner@"))) {
                router.push("/")
            }
        }
    }, [user, isLoading, router])

    return (
        <AuthGuard allowedRoles={["admin"]}>
            <div className="flex min-h-screen flex-col bg-background">
                <OwnerNavDrawer />
                <main className="flex-1 w-full max-w-4xl mx-auto relative px-4 py-6">{children}</main>
            </div>
        </AuthGuard>
    )
}
