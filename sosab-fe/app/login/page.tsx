"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { HardHat, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react"
import { toast } from "sonner"
import { ThemeToggle } from "@/components/theme-toggle"

export default function LoginPage() {
  const router = useRouter()
  const { login } = useAuth()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setIsLoading(true)
    try {
      await login(email, password)
      toast.success("Welcome back!")
      router.push("/")
    } catch (err: any) {
      toast.error(err.message || "Invalid email or password")
      setError("Invalid email or password")
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemo = (type: "admin" | "pm") => {
    setEmail(type === "admin" ? "admin@sosab.com" : "pm@sosab.com")
    setPassword("demo123")
    setError("")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-4">
      {/* Theme Toggle - Floating */}
      <div className="absolute right-4 top-4 z-50">
        <ThemeToggle />
      </div>

      {/* Background grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `linear-gradient(var(--primary) 1px, transparent 1px), linear-gradient(90deg, var(--primary) 1px, transparent 1px)`,
          backgroundSize: "60px 60px",
        }}
      />

      {/* Glowing orbs */}
      <div className="pointer-events-none absolute left-1/4 top-1/4 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-1/4 right-1/4 h-64 w-64 translate-x-1/2 translate-y-1/2 rounded-full bg-secondary/10 blur-[120px]" />

      <Card className="relative w-full max-w-md border-border/50 bg-card/80 backdrop-blur-xl">
        <CardHeader className="space-y-4 text-center">
          {/* Logo */}
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 shadow-lg shadow-primary/25">
            <HardHat className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <CardTitle className="font-display text-3xl font-bold tracking-tight">
              SOSAB<span className="text-primary">.</span>Tracker
            </CardTitle>
            <CardDescription className="mt-2 text-muted-foreground">Construction Management System</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-border/50 bg-muted/50 focus:border-primary"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-border/50 bg-muted/50 pr-10 focus:border-primary"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary font-medium text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-primary/40 active:scale-[0.98] disabled:opacity-50"
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
          </form>

          {/* Demo credentials */}
          <div className="space-y-3 rounded-lg border border-dashed border-border/50 bg-muted/30 p-4">
            <p className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Demo Accounts
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo("admin")}
                className="flex-1 border-primary/30 text-primary hover:bg-primary/10"
              >
                Admin
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fillDemo("pm")}
                className="flex-1 border-secondary/30 text-secondary hover:bg-secondary/10"
              >
                Manager
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Password: <code className="rounded bg-muted px-1.5 py-0.5">demo123</code>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
