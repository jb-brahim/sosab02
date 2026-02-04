"use client"

import { useState, useEffect, useRef } from "react"
import { useAuth } from "@/lib/auth-context"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Loader2, Printer, ChevronLeft } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { format } from "date-fns"

export default function SalaryReportPage() {
    const { user } = useAuth()
    const router = useRouter()

    const [projects, setProjects] = useState<any[]>([])
    const [selectedProject, setSelectedProject] = useState<string>("")
    const [selectedWeek, setSelectedWeek] = useState<string>(() => {
        // Default to current week "YYYY-Www"
        const now = new Date()
        const onejan = new Date(now.getFullYear(), 0, 1)
        const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7)
        return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`
    })

    const [reportData, setReportData] = useState<any>(null)
    const [loading, setLoading] = useState(false)

    // Fetch user's projects
    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/projects')
                const list = res.data.data || []
                setProjects(list)
                if (list.length > 0) {
                    setSelectedProject(list[0]._id)
                }
            } catch (error) {
                console.error("Failed to fetch projects", error)
            }
        }
        fetchProjects()
    }, [])

    // Fetch report when project or week changes
    useEffect(() => {
        const fetchReport = async () => {
            if (!selectedProject || !selectedWeek) return

            try {
                setLoading(true)
                const res = await api.get(`/salary/${selectedProject}/${selectedWeek}`)
                if (res.data.success) {
                    setReportData(res.data)
                }
            } catch (error) {
                console.error("Failed to fetch salary report", error)
                toast.error("Failed to load report")
            } finally {
                setLoading(false)
            }
        }

        fetchReport()
    }, [selectedProject, selectedWeek])

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="min-h-screen bg-background p-4 pb-20">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6 print:hidden">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ChevronLeft className="h-5 w-5" />
                </Button>
                <h1 className="text-xl font-bold">Weekly Salary Report</h1>
            </div>

            {/* Controls */}
            <div className="grid gap-4 mb-6 print:hidden">
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Project</label>
                        <Select value={selectedProject} onValueChange={setSelectedProject}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((p) => (
                                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-xs font-medium text-muted-foreground mb-1 block">Week</label>
                        <Input
                            type="week"
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {/* Report Content */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : reportData ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                    {/* Summary Card */}
                    <Card className="border-primary/20 bg-primary/5 print:border-none print:shadow-none">
                        <CardHeader className="text-center pb-2">
                            <div className="flex items-center justify-center gap-2 mb-1">
                                <h2 className="text-lg font-bold uppercase tracking-wider">{reportData.project.name}</h2>
                            </div>
                            <p className="text-sm text-muted-foreground">Week {reportData.week}</p>
                        </CardHeader>
                        <CardContent className="text-center">
                            <span className="text-xs text-muted-foreground uppercase">Total Payout</span>
                            <div className="text-4xl font-bold text-primary mt-1">
                                ${reportData.totalSalary.toLocaleString()}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Worker Breakdown */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider ml-1">Breakdown</h3>
                        {reportData.data.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                                No records found for this week.
                            </div>
                        ) : (
                            reportData.data.map((item: any) => (
                                <Card key={item.worker.id} className="print:shadow-none print:border-b print:rounded-none">
                                    <CardContent className="p-4 flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{item.worker.name}</p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                                                <span className="bg-secondary px-1.5 py-0.5 rounded">
                                                    {item.salary.breakdown.daysWorked} days
                                                </span>
                                                {item.salary.breakdown.overtime > 0 && (
                                                    <span className="text-orange-500">
                                                        +{item.salary.breakdown.overtimeHours}h OT
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold">${item.salary.totalSalary.toLocaleString()}</p>
                                            <p className="text-[10px] text-muted-foreground">
                                                Base: ${item.salary.breakdown.baseSalary}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Print Button */}
                    <Button className="w-full print:hidden" onClick={handlePrint}>
                        <Printer className="mr-2 h-4 w-4" />
                        Print / Save PDF
                    </Button>
                </div>
            ) : (
                <div className="text-center py-12 text-muted-foreground">Select a project and week to view report.</div>
            )}

            {/* hidden print styles */}
            <style jsx global>{`
                @media print {
                    .print\\:hidden { display: none !important; }
                    .print\\:shadow-none { box-shadow: none !important; }
                    .print\\:border-none { border: none !important; }
                    body { background: white; }
                }
            `}</style>
        </div>
    )
}
