"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, Calendar, Check, X } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { format, startOfWeek } from "date-fns"

interface Project {
    _id: string
    name: string
}

export default function AttendancePage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [selectedWeek, setSelectedWeek] = useState<string>(() => {
        const now = new Date()
        const onejan = new Date(now.getFullYear(), 0, 1)
        const week = Math.ceil((((now.getTime() - onejan.getTime()) / 86400000) + onejan.getDay() + 1) / 7)
        return `${now.getFullYear()}-W${week.toString().padStart(2, '0')}`
    })
    const [attendance, setAttendance] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isLoadingProjects, setIsLoadingProjects] = useState(true)

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get("/projects")
                if (res.data.success) {
                    setProjects(res.data.data)
                    if (res.data.data.length > 0) {
                        setSelectedProjectId(res.data.data[0]._id)
                    }
                }
            } catch (error: any) {
                toast.error("Failed to load projects")
            } finally {
                setIsLoadingProjects(false)
            }
        }
        fetchProjects()
    }, [])

    useEffect(() => {
        if (!selectedProjectId) return

        const fetchAttendance = async () => {
            setIsLoading(true)
            try {
                const res = await api.get(`/attendance/${selectedProjectId}/${selectedWeek}`)
                if (res.data.success) {
                    setAttendance(res.data.data)
                }
            } catch (error: any) {
                toast.error(error.message || "Failed to fetch attendance")
                setAttendance([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchAttendance()
    }, [selectedProjectId, selectedWeek])

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">Attendance</h1>
                    <p className="text-muted-foreground mt-1">Worker attendance logs.</p>
                </div>
                <div className="flex gap-4">
                    <Input
                        type="week"
                        value={selectedWeek}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="w-[180px] bg-background"
                    />
                    {/* Project Selector */}
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoadingProjects}>
                        <SelectTrigger className="w-[200px] bg-background">
                            <SelectValue placeholder="Select Project" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((p) => (
                                <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Card className="border border-border bg-card">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-amber-500" />
                        Weekly Records
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingProjects ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                        </div>
                    ) : !selectedProjectId ? (
                        <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                            Please select a project to view attendance.
                        </div>
                    ) : isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Worker</TableHead>
                                    <TableHead className="text-center">Sun</TableHead>
                                    <TableHead className="text-center">Mon</TableHead>
                                    <TableHead className="text-center">Tue</TableHead>
                                    <TableHead className="text-center">Wed</TableHead>
                                    <TableHead className="text-center">Thu</TableHead>
                                    <TableHead className="text-center">Fri</TableHead>
                                    <TableHead className="text-center">Sat</TableHead>
                                    <TableHead className="text-center">Total</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendance.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={9} className="text-center h-24 text-muted-foreground">
                                            No attendance records found for this week.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendance.map((record) => (
                                        <TableRow key={record.workerId} className="hover:bg-muted/30 transition-colors">
                                            <TableCell className="font-medium">{record.workerName}</TableCell>
                                            {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].map(day => (
                                                <TableCell key={day} className="text-center">
                                                    {record[day] ? (
                                                        <Check className="h-4 w-4 text-green-500 mx-auto" />
                                                    ) : (
                                                        <X className="h-4 w-4 text-muted-foreground/30 mx-auto" />
                                                    )}
                                                </TableCell>
                                            ))}
                                            <TableCell className="text-center">
                                                <Badge variant="outline" className="text-amber-600 border-amber-500/30 bg-amber-500/5 font-semibold">
                                                    {["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].filter(d => record[d]).length}d
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
