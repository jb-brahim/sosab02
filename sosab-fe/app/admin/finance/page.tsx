"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Banknote, TrendingUp, TrendingDown, DollarSign, Wallet, ArrowUpRight, ArrowDownRight, Printer } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area, Cell } from 'recharts'
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

export default function FinancePage() {
    const [isLoading, setIsLoading] = useState(true)
    const [stats, setStats] = useState({
        totalBudget: 0,
        earnedValue: 0,
        projectCount: 0,
        avgProgress: 0
    })
    const [projectData, setProjectData] = useState<any[]>([])

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get("/projects")
                if (res.data.success) {
                    const projects = res.data.data

                    // Calculate Metrics
                    const totalBudget = projects.reduce((acc: number, p: any) => acc + (p.budget || 0), 0)
                    const earnedValue = projects.reduce((acc: number, p: any) => acc + ((p.budget || 0) * (p.progress || 0) / 100), 0)
                    const avgProgress = projects.reduce((acc: number, p: any) => acc + (p.progress || 0), 0) / (projects.length || 1)

                    setStats({
                        totalBudget,
                        earnedValue,
                        projectCount: projects.length,
                        avgProgress
                    })

                    // Prepare Chart Data
                    const chartData = projects.map((p: any) => ({
                        name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
                        budget: p.budget,
                        earned: (p.budget * (p.progress || 0) / 100)
                    })).sort((a: any, b: any) => b.budget - a.budget).slice(0, 10) // Top 10 by budget

                    setProjectData(chartData)
                }
            } catch (error) {
                toast.error("Failed to fetch financial data")
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [])

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Financial Health</h1>
                    <p className="text-muted-foreground mt-1">Real-time budget analysis and earned value management.</p>
                </div>
                <Button className="gap-2">
                    <Printer className="h-4 w-4" />
                    Export Report
                </Button>
            </div>

            {/* KPI Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-primary text-primary-foreground">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium opacity-90">Total Portfolio Value</CardTitle>
                        <Banknote className="h-4 w-4 opacity-90" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.totalBudget.toLocaleString()} TND</div>
                        <p className="text-xs opacity-75 mt-1">
                            Across {stats.projectCount} active projects
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Earned Value (EV)</CardTitle>
                        <TrendingUp className="h-4 w-4 text-success" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-success flex items-center gap-2">
                            {Math.round(stats.earnedValue).toLocaleString()} TND
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Value of work completed based on progress
                        </p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Remaining Budget</CardTitle>
                        <Wallet className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(stats.totalBudget - stats.earnedValue).toLocaleString()} TND
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                            <Progress value={stats.avgProgress} className="h-1.5" />
                            <span className="text-xs text-muted-foreground whitespace-nowrap">{Math.round(stats.avgProgress)}% Avg</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                    <CardHeader>
                        <CardTitle>Budget vs Earned Value</CardTitle>
                        <CardDescription>
                            Comparing allocated budget against work completed for top projects.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={350}>
                            <BarChart data={projectData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis
                                    dataKey="name"
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="#888888"
                                    fontSize={12}
                                    tickLine={false}
                                    axisLine={false}
                                    tickFormatter={(value) => `${value / 1000}k`}
                                />
                                <Tooltip
                                    formatter={(value: number) => [`${value.toLocaleString()} TND`, '']}
                                    cursor={{ fill: 'transparent' }}
                                />
                                <Legend />
                                <Bar dataKey="budget" name="Total Budget" fill="#0f172a" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="earned" name="Earned Value" fill="#10b981" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <Card className="col-span-3">
                    <CardHeader>
                        <CardTitle>Cash Flow Estimation</CardTitle>
                        <CardDescription>
                            Estimated weekly expenditure based on active workforce.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[350px] flex items-center justify-center border-2 border-dashed rounded-lg bg-muted/10">
                            <div className="text-center p-6">
                                <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                                <h3 className="font-semibold text-lg">Cash Flow Module</h3>
                                <p className="text-sm text-muted-foreground mb-4 max-w-xs mx-auto">
                                    Historical cash flow analysis and future projections will appear here once more payroll data is collected.
                                </p>
                                <Button variant="outline">Configure Payroll</Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
