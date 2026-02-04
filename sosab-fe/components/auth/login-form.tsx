"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuthStore } from "@/lib/auth-store"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, Loader2, Eye, EyeOff } from "lucide-react"

export function LoginForm() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState("")
  const { login, isLoading } = useAuthStore()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    try {
      await login(email, password)
      const user = useAuthStore.getState().user
      if (user?.role === "admin") {
        router.push("/admin")
      } else {
        router.push("/app")
      }
    } catch {
      setError("Invalid email or password")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border bg-card">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl bg-primary glow-primary">
            <HardHat className="h-8 w-8 text-primary-foreground" />
          </div>
          <CardTitle className="font-display text-3xl tracking-wide">SOSAB Tracker</CardTitle>
          <CardDescription className="text-muted-foreground">Construction Management System</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@sosab.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-input pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </Button>

            <div className="mt-6 rounded-lg border border-border bg-muted/50 p-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Demo Credentials:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p>
                  <span className="text-secondary">Admin:</span> admin@sosab.com
                </p>
                <p>
                  <span className="text-secondary">PM:</span> pm@sosab.com
                </p>
                <p>
                  <span className="text-secondary">Password:</span> demo123
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
