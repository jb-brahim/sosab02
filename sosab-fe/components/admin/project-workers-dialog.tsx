import { useEffect, useState } from "react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Loader2, MoreHorizontal, CalendarDays } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { WorkerDetailsDialog } from "@/components/admin/worker-details-dialog"
import { EditWorkerDialog } from "@/components/admin/edit-worker-dialog"
import { WorkerAttendanceDialog } from "@/components/admin/worker-attendance-dialog"

interface Worker {
    _id: string
    name: string
    trade: string
    status: "active" | "inactive"
    dailySalary: number
    skills: string[]
    contact?: {
        phone?: string
        address?: string
    }
    projectId?: {
        _id?: string
        name: string
    }
}

interface ProjectWorkersDialogProps {
    projectId: string | null
    projectName: string | null
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function ProjectWorkersDialog({ projectId, projectName, open, onOpenChange }: ProjectWorkersDialogProps) {
    const [workers, setWorkers] = useState<Worker[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Sub-dialog states
    const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null)
    const [detailsDialogOpen, setDetailsDialogOpen] = useState(false)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false)

    const fetchWorkers = async () => {
        if (!projectId) return;
        setIsLoading(true)
        try {
            const res = await api.get(`/workers/${projectId}`)
            if (res.data.success) {
                setWorkers(res.data.data)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch project workers")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (open && projectId) {
            fetchWorkers()
        }
    }, [open, projectId])

    const handleDelete = async () => {
        if (!selectedWorker) return
        try {
            const res = await api.delete(`/workers/${selectedWorker._id}`)
            if (res.data.success) {
                toast.success("Worker removed successfully")
                fetchWorkers() // Refresh the list
                setDeleteDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to remove worker")
        }
    }

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="w-full sm:max-w-[70vw] max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Workers in {projectName}</DialogTitle>
                    </DialogHeader>

                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Daily Salary</TableHead>
                                    <TableHead>Phone</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {workers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No workers assigned to this project.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    workers.map((worker) => (
                                        <TableRow key={worker._id}>
                                            <TableCell className="font-medium">{worker.name}</TableCell>
                                            <TableCell>{worker.trade}</TableCell>
                                            <TableCell>{worker.dailySalary} TND</TableCell>
                                            <TableCell>{worker.contact?.phone || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={worker.status === "active" ? "default" : "secondary"}>
                                                    {worker.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedWorker(worker)
                                                            setDetailsDialogOpen(true)
                                                        }}>
                                                            View Profile
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedWorker(worker)
                                                            setAttendanceDialogOpen(true)
                                                        }}>
                                                            <CalendarDays className="mr-2 h-4 w-4" />
                                                            View Attendance
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedWorker(worker)
                                                            setEditDialogOpen(true)
                                                        }}>
                                                            Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setSelectedWorker(worker)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            Remove
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </DialogContent>
            </Dialog>

            {/* Nested Dialogs */}
            <WorkerDetailsDialog
                worker={selectedWorker}
                open={detailsDialogOpen}
                onOpenChange={setDetailsDialogOpen}
            />

            <WorkerAttendanceDialog
                worker={selectedWorker}
                open={attendanceDialogOpen}
                onOpenChange={setAttendanceDialogOpen}
            />

            <EditWorkerDialog
                worker={selectedWorker}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onWorkerUpdated={fetchWorkers}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove Worker?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will mark the worker <strong>{selectedWorker?.name}</strong> as inactive. They will no longer appear in active lists.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Remove Worker
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
