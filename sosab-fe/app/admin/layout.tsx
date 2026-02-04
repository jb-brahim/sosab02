import type React from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { AdminLayout } from "@/components/layouts/admin-layout"
import { ErrorBoundary } from "@/components/error-boundary"

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <ErrorBoundary>
        <AdminLayout>{children}</AdminLayout>
      </ErrorBoundary>
    </AuthGuard>
  )
}
