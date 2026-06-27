"use client"

import { AuthGuard } from "@/components/auth/auth-guard"
import { OwnerSidebar, OwnerTopbar } from "@/components/layouts/owner-nav-drawer"
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
            if (user.role !== "admin" || (user.email !== "owner@company.com" && !user.email.startsWith("owner@"))) {
                router.push("/")
            }
        }
    }, [user, isLoading, router])

    return (
        <AuthGuard allowedRoles={["admin"]}>
            <div className="flex h-screen bg-background overflow-hidden">
                {/* Left: Persistent sidebar — only visible on lg+ */}
                <OwnerSidebar />

                {/* Right: Topbar + scrollable content */}
                <div className="flex flex-1 flex-col overflow-hidden min-w-0">
                    <OwnerTopbar />
                    <main className="flex-1 overflow-y-auto px-4 py-5 lg:px-8 lg:py-6">
                        {children}
                    </main>
                </div>
            </div>
        </AuthGuard>
    )
}
