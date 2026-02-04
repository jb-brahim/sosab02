"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

const data = [
  { name: "Mon", materials: 24, workers: 18 },
  { name: "Tue", materials: 32, workers: 22 },
  { name: "Wed", materials: 28, workers: 20 },
  { name: "Thu", materials: 45, workers: 28 },
  { name: "Fri", materials: 38, workers: 25 },
  { name: "Sat", materials: 15, workers: 12 },
  { name: "Sun", materials: 8, workers: 6 },
]

export function ActivityChart() {
  return (
    <Card className="border-border bg-card">
      <CardHeader>
        <CardTitle className="text-lg font-medium">Weekly Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full min-w-0">
          <ResponsiveContainer width="99%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorMaterials" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.82 0.17 85)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.82 0.17 85)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorWorkers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="oklch(0.62 0.21 255)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="oklch(0.62 0.21 255)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.28 0.01 285)" />
              <XAxis dataKey="name" stroke="oklch(0.65 0.01 285)" fontSize={12} />
              <YAxis stroke="oklch(0.65 0.01 285)" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "oklch(0.17 0.005 285)",
                  border: "1px solid oklch(0.28 0.01 285)",
                  borderRadius: "8px",
                }}
                labelStyle={{ color: "oklch(0.98 0 0)" }}
              />
              <Area
                type="monotone"
                dataKey="materials"
                stroke="oklch(0.82 0.17 85)"
                fillOpacity={1}
                fill="url(#colorMaterials)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="workers"
                stroke="oklch(0.62 0.21 255)"
                fillOpacity={1}
                fill="url(#colorWorkers)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 flex items-center justify-center gap-6">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-primary" />
            <span className="text-sm text-muted-foreground">Material Logs</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-secondary" />
            <span className="text-sm text-muted-foreground">Worker Activity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
