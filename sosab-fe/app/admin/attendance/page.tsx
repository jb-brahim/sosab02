"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, Calendar } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { format, startOfWeek } from "date-fns"

interface Project {
    _id: string
    name: string
}

interface AttendanceRecord {
    _id: string
    date: string
    workerId: { name: string }
    present: boolean
    overtime: number
}

export default function AttendancePage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProjectId, setSelectedProjectId] = useState<string>("")
    const [selectedWeek, setSelectedWeek] = useState<string>(format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd"))
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
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
                    <h1 className="font-display text-3xl font-bold tracking-tight">Attendance</h1>
                    <p className="text-muted-foreground mt-1">Worker attendance logs.</p>
                </div>
                <div className="flex gap-4">
                    {/* Week Selector (Simplified for now - just uses current week default) */}
                    {/* Project Selector */}
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId} disabled={isLoadingProjects}>
                        <SelectTrigger className="w-[200px]">
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

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Weekly Records
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoadingProjects ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : !selectedProjectId ? (
                        <div className="text-center h-24 flex items-center justify-center text-muted-foreground">
                            Please select a project to view attendance.
                        </div>
                    ) : isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Worker</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Overtime (h)</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendance.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                                            No attendance records found for this week.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendance.map((record) => (
                                        <TableRow key={record._id}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                                {new Date(record.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </TableCell>
                                            <TableCell>{record.workerId?.name}</TableCell>
                                            <TableCell>
                                                <Badge variant={record.present ? "success" : "destructive"}>
                                                    {record.present ? "Present" : "Absent"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{record.overtime > 0 ? `+${record.overtime}` : "-"}</TableCell>
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
