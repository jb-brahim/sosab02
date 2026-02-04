"use client"

import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, type LucideIcon } from "lucide-react"

interface KPICardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  variant?: "default" | "warning" | "info" | "success"
}

export function KPICard({ title, value, change, changeLabel, icon: Icon, variant = "default" }: KPICardProps) {
  const variantStyles = {
    default: "border-border",
    warning: "border-primary/30 bg-primary/5",
    info: "border-secondary/30 bg-secondary/5",
    success: "border-success/30 bg-success/5",
  }

  const iconStyles = {
    default: "bg-muted text-foreground",
    warning: "bg-primary/20 text-primary",
    info: "bg-secondary/20 text-secondary",
    success: "bg-success/20 text-success",
  }

  return (
    <Card className={cn("transition-all hover:shadow-lg", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="font-display text-3xl font-bold tracking-tight">{value}</p>
            {change !== undefined && (
              <div className="flex items-center gap-1 text-sm">
                {change >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-success" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
                <span className={change >= 0 ? "text-success" : "text-destructive"}>
                  {change >= 0 ? "+" : ""}
                  {change}%
                </span>
                {changeLabel && <span className="text-muted-foreground">{changeLabel}</span>}
              </div>
            )}
          </div>
          <div className={cn("rounded-lg p-3", iconStyles[variant])}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
