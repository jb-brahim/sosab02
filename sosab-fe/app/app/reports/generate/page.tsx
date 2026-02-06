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

export default function GenerateReportPage() {
    const router = useRouter()
    const [projects, setProjects] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [generating, setGenerating] = useState(false)

    const [formData, setFormData] = useState({
        projectId: "",
        type: "attendance",
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
                toast.success(`${formData.type === 'attendance' ? 'Attendance' : 'Payment'} report generated successfully!`)

                // Download the file
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
                const backendBase = apiUrl.replace(/\/api\/?$/, '')
                const downloadUrl = `${backendBase}${res.data.data.pdfUrl}`
                window.open(downloadUrl, '_blank')

                // Redirect to reports page after a short delay
                setTimeout(() => {
                    router.push('/app/reports')
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
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
            <div className="flex items-center gap-2 mb-4">
                <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="w-5 h-5" />
                </Button>
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <FileText className="w-6 h-6 text-primary" />
                        Generate Report
                    </h1>
                    <p className="text-muted-foreground text-xs">Create attendance or payment reports</p>
                </div>
            </div>

            <Card>
                <CardContent className="p-6 space-y-6">
                    {/* Project Selection */}
                    <div className="space-y-2">
                        <Label htmlFor="project">Project</Label>
                        <Select
                            value={formData.projectId}
                            onValueChange={(value) => setFormData({ ...formData, projectId: value })}
                        >
                            <SelectTrigger id="project">
                                <SelectValue placeholder="Select a project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem key={project._id} value={project._id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Report Type */}
                    <div className="space-y-2">
                        <Label>Report Type</Label>
                        <RadioGroup
                            value={formData.type}
                            onValueChange={(value) => setFormData({ ...formData, type: value })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="attendance" id="attendance" />
                                <Label htmlFor="attendance" className="font-normal cursor-pointer">
                                    Attendance Report (0/1 Grid)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="payment" id="payment" />
                                <Label htmlFor="payment" className="font-normal cursor-pointer">
                                    Payment Summary Report
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Date Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Format Selection */}
                    <div className="space-y-2">
                        <Label>Export Format</Label>
                        <RadioGroup
                            value={formData.format}
                            onValueChange={(value) => setFormData({ ...formData, format: value })}
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="pdf" id="pdf" />
                                <Label htmlFor="pdf" className="font-normal cursor-pointer flex items-center gap-2">
                                    <FileText className="w-4 h-4" />
                                    PDF (Printable)
                                </Label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="excel" id="excel" />
                                <Label htmlFor="excel" className="font-normal cursor-pointer flex items-center gap-2">
                                    <FileSpreadsheet className="w-4 h-4" />
                                    Excel (Editable)
                                </Label>
                            </div>
                        </RadioGroup>
                    </div>

                    {/* Generate Button */}
                    <Button
                        onClick={handleGenerate}
                        disabled={generating || loading}
                        className="w-full"
                        size="lg"
                    >
                        {generating ? (
                            <>
                                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                                Generating...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4 mr-2" />
                                Generate Report
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
