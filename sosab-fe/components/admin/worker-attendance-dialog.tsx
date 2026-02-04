"use client"

import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Loader2, Calendar } from "lucide-react"
import api from "@/lib/api"
import { format } from "date-fns"

interface Worker {
    _id: string
    name: string
    trade: string
}

interface AttendanceRecord {
    _id: string
    date: string
    projectId: {
        _id: string
        name: string
    }
    present: boolean
    overtime: number
    notes?: string
    markedBy: {
        name: string
    }
}

interface WorkerAttendanceDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    worker: Worker | null
}

export function WorkerAttendanceDialog({
    open,
    onOpenChange,
    worker
}: WorkerAttendanceDialogProps) {
    const [attendance, setAttendance] = useState<AttendanceRecord[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (open && worker) {
            fetchAttendance()
        } else {
            setAttendance([])
        }
    }, [open, worker])

    const fetchAttendance = async () => {
        if (!worker) return
        setIsLoading(true)
        try {
            const res = await api.get(`/attendance/worker/${worker._id}`)
            if (res.data.success) {
                setAttendance(res.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch attendance:", error)
        } finally {
            setIsLoading(false)
        }
    }

    // Calculate stats
    const totalDays = attendance.filter(a => a.present).length
    const totalOvertime = attendance.reduce((sum, a) => sum + (a.overtime || 0), 0)

    if (!worker) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Attendance History: {worker.name}</DialogTitle>
                    <DialogDescription>
                        Complete record of site attendance and overtime.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-4 py-4 text-sm">
                    <div className="bg-muted px-3 py-1 rounded-md">
                        <span className="text-muted-foreground mr-2">Total Days Worked:</span>
                        <span className="font-semibold">{totalDays}</span>
                    </div>
                    <div className="bg-muted px-3 py-1 rounded-md">
                        <span className="text-muted-foreground mr-2">Total Overtime:</span>
                        <span className="font-semibold">{totalOvertime}h</span>
                    </div>
                </div>

                <div className="flex-1 overflow-auto border rounded-md">
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader className="sticky top-0 bg-secondary">
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Overtime</TableHead>
                                    <TableHead>Marked By</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendance.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No attendance records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    attendance.map((record) => (
                                        <TableRow key={record._id}>
                                            <TableCell className="font-medium">
                                                {format(new Date(record.date), "MMM d, yyyy")}
                                            </TableCell>
                                            <TableCell>{record.projectId?.name || "Unknown"}</TableCell>
                                            <TableCell>
                                                <Badge variant={record.present ? "success" : "destructive"}>
                                                    {record.present ? "Present" : "Absent"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {record.overtime > 0 ? (
                                                    <span className="text-amber-600 font-medium">+{record.overtime}h</span>
                                                ) : "-"}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground text-xs">
                                                {record.markedBy?.name}
                                            </TableCell>
                                            <TableCell className="max-w-[150px] truncate text-muted-foreground" title={record.notes}>
                                                {record.notes}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
