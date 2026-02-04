import type React from "react"
import { AuthGuard } from "@/components/auth/auth-guard"
import { MobileLayout } from "@/components/layouts/mobile-layout"

export const dynamic = "force-dynamic"

export default function AppRootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AuthGuard allowedRoles={["pm", "worker"]}>
      <MobileLayout>{children}</MobileLayout>
    </AuthGuard>
  )
}
