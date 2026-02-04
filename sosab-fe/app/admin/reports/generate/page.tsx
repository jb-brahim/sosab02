"use client"

import { useState, useEffect } from "react"
import api from "@/lib/api"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FileText, Download, Calendar, ArrowLeft, FileSpreadsheet } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function AdminGenerateReportPage() {
    const router = useRouter()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    const [formData, setFormData] = useState({
        projectId: "",
        type: "salary",
        startDate: "",
        endDate: "",
        format: "pdf"
    })

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                setLoading(true)
                const res = await api.get('/projects')
                if (res.data.success) {
                    setProjects(res.data.data)
                }
            } catch (error) {
                console.error("Failed to load projects", error)
                toast.error("Failed to load projects")
            } finally {
                setLoading(false)
            }
        }
        fetchProjects()
    }, [])

    const handleGenerate = async () => {
        // Validation
        if (!formData.projectId) {
            toast.error("Please select a project")
            return
        }
        if (!formData.startDate || !formData.endDate) {
            toast.error("Please select start and end dates")
            return
        }

        // Validate date range
        const start = new Date(formData.startDate)
        const end = new Date(formData.endDate)
        const diffTime = Math.abs(end.getTime() - start.getTime())
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

        if (diffDays > 31) {
            toast.error("Date range cannot exceed 31 days")
            return
        }

        if (start > end) {
            toast.error("Start date must be before end date")
            return
        }

        try {
            setGenerating(true)
            const res = await api.post('/reports/generate', formData)

            if (res.data.success) {
                toast.success(`${formData.type.charAt(0).toUpperCase() + formData.type.slice(1)} report generated successfully!`)

                // Download the file
                const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                const downloadUrl = `${backendUrl}${res.data.data.pdfUrl}`
                window.open(downloadUrl, '_blank')

                // Redirect to reports page after a short delay
                setTimeout(() => {
                    router.push('/admin/reports')
                }, 1500)
            }
        } catch (error: any) {
            console.error("Failed to generate report", error)
            toast.error(error.response?.data?.message || "Failed to generate report")
        } finally {
            setGenerating(false)
        }
    }

    return (
        <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2 font-display">
                        <FileText className="w-8 h-8 text-primary" />
                        Generate Report
                    </h1>
                    <p className="text-muted-foreground mt-1">Create attendance, material, or salary reports</p>
                </div>
            </div>

            <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8 space-y-8">
                    {/* Project Selection */}
                    <div className="space-y-3">
                        <Label htmlFor="project" className="text-sm font-semibold tracking-tight uppercase opacity-70">Project</Label>
                        <Select
                            value={formData.projectId}
                            onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                        >
                            <SelectTrigger id="project" className="h-12 text-base">
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem key={project._id} value={project._id} className="text-base">
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Report Type */}
                    <div className="space-y-4">
                        <Label className="text-sm font-semibold tracking-tight uppercase opacity-70">Report Type</Label>
                        <RadioGroup
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                            className="grid grid-cols-1 md:grid-cols-2 gap-4"
                        >
                            <div
                                className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.type === 'attendance' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border hover:bg-muted/30'}`}
                                onClick={() => setFormData({ ...formData, type: 'attendance' })}
                            >
                                <RadioGroupItem value="attendance" id="attendance" />
                                <Label htmlFor="attendance" className="font-medium cursor-pointer flex-1">
                                    Attendance Report
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5">0/1 Attendance grid for all workers</p>
                                </Label>
                            </div>
                            <div
                                className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.type === 'payment' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border hover:bg-muted/30'}`}
                                onClick={() => setFormData({ ...formData, type: 'payment' })}
                            >
                                <RadioGroupItem value="payment" id="payment" />
                                <Label htmlFor="payment" className="font-medium cursor-pointer flex-1">
                                    Salary Report
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5">Worker pay summary and totals</p>
                                </Label>
                            </div>
                            <div
                                className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.type === 'material' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border hover:bg-muted/30'}`}
                                onClick={() => setFormData({ ...formData, type: 'material' })}
                            >
                                <RadioGroupItem value="material" id="material" />
                                <Label htmlFor="material" className="font-medium cursor-pointer flex-1">
                                    Material Report
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5">List of materials received and used</p>
                                </Label>
                            </div>
                            <div
                                className={`flex items-center space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${formData.type === 'activity' ? 'border-primary bg-primary/5' : 'border-border/50 hover:border-border hover:bg-muted/30'}`}
                                onClick={() => setFormData({ ...formData, type: 'activity' })}
                            >
                                <RadioGroupItem value="activity" id="activity" />
                                <Label htmlFor="activity" className="font-medium cursor-pointer flex-1">
                                    Activity Report
                                    <p className="text-xs text-muted-foreground font-normal mt-0.5">Daily progress logs and issues</p>
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                            <Label htmlFor="startDate" className="text-sm font-semibold tracking-tight uppercase opacity-70">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                className="h-12 text-base"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-3">
                            <Label htmlFor="endDate" className="text-sm font-semibold tracking-tight uppercase opacity-70">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                className="h-12 text-base"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold tracking-tight uppercase opacity-70">Export Format</Label>
                        <Tabs
                            value={formData.format}
                            onValueChange={(val: string) => setFormData({ ...formData, format: val })}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2 h-14 p-1">
                                <TabsTrigger value="pdf" className="h-full text-base gap-2">
                                    <FileText className="w-5 h-5" />
                                    PDF (Printable)
                                </TabsTrigger>
                                <TabsTrigger value="excel" className="h-full text-base gap-2">
                                    <FileSpreadsheet className="w-5 h-5" />
                                    Excel (Editable)
                                </TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || loading}
                        className="w-full h-14 mt-4 text-lg font-bold shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99]"
                        size="lg"
                    >
                        {generating ? (
                            <>
                                <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3" />
                                Generating Report...
                            </>
                        ) : (
                            <>
                                <Download className="w-5 h-5 mr-3" />
                                Generate Final Report
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
