"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, MoreHorizontal, CheckSquare } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateTaskDialog } from "@/components/admin/create-task-dialog"
import { EditTaskDialog } from "@/components/admin/edit-task-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Task {
    _id: string
    name: string
    title: string // Note: Backend uses 'name', frontend interface had 'title' but code used 'title'. Adjusting to 'name' based on model.
    description: string
    status: string
    priority: string
    deadline: string
    startDate: string
    endDate: string
    // Need to handle different shapes if backend returns one thing and frontend expects another
    project: { name: string } | null
    assignedWorkers: { name: string }[] // Backend uses assignedWorkers
    assignedTo: { name: string }[] // Frontend interface used assignedTo
    projectId: any
}

const priorityColors: Record<string, string> = {
    Low: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
    Medium: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
    High: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300",
    Critical: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
}

export default function TasksPage() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [selectedTask, setSelectedTask] = useState<Task | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const fetchTasks = async () => {
        try {
            const res = await api.get("/tasks")
            if (res.data.success) {
                // Map backend data if needed
                // Backend: name, assignedWorkers
                // Frontend previous: title, assignedTo
                // Let's normalize here or update interface
                const mappedTasks = res.data.data.map((t: any) => ({
                    ...t,
                    title: t.name,
                    assignedTo: t.assignedWorkers
                }))
                setTasks(mappedTasks)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch tasks")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchTasks()
    }, [])

    const handleDelete = async () => {
        if (!selectedTask) return
        try {
            const res = await api.delete(`/tasks/${selectedTask._id}`)
            if (res.data.success) {
                toast.success("Task deleted successfully")
                fetchTasks()
                setDeleteDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete task")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Tasks</h1>
                    <p className="text-muted-foreground mt-1">Manage project deliverables.</p>
                </div>
                <CreateTaskDialog onTaskCreated={fetchTasks} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <CheckSquare className="h-5 w-5 text-primary" />
                        All Tasks
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Title</TableHead>
                                    <TableHead>Project</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Assigned To</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Deadline</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {tasks.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No tasks found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    tasks.map((task) => (
                                        <TableRow key={task._id}>
                                            <TableCell className="font-medium">
                                                {task.name}
                                                <p className="text-xs text-muted-foreground truncate max-w-[200px]">{task.description}</p>
                                            </TableCell>
                                            <TableCell>{(task.project as any)?.name || "Global"}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={priorityColors[task.priority] || priorityColors.Medium}>
                                                    {task.priority}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex -space-x-2 overflow-hidden">
                                                    {task.assignedWorkers?.length > 0 ?
                                                        task.assignedWorkers.map((u: any, i: number) => (
                                                            <div key={i} title={u.name} className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-muted border border-background text-[10px] font-medium ring-2 ring-background">
                                                                {u.name?.charAt(0)}
                                                            </div>
                                                        )) : <span className="text-muted-foreground text-sm pl-2">Unassigned</span>
                                                    }
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="capitalize">
                                                    {task.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-sm">
                                                {task.endDate ? new Date(task.endDate).toLocaleDateString() : '-'}
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
                                                            setSelectedTask(task)
                                                            setEditDialogOpen(true)
                                                        }}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setSelectedTask(task)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            Delete
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
                </CardContent>
            </Card>

            <EditTaskDialog
                task={selectedTask}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onTaskUpdated={fetchTasks}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the task
                            <span className="font-semibold"> {selectedTask?.name} </span>
                            and remove it from the project.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Task
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
