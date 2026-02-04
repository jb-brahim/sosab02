"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

interface Task {
    _id: string
    name: string
    description: string
    projectId: any // could be string or object
    priority: string
    status: string
    startDate: string
    endDate: string
}

interface EditTaskDialogProps {
    task: Task | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onTaskUpdated: () => void
}

export function EditTaskDialog({ task, open, onOpenChange, onTaskUpdated }: EditTaskDialogProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        priority: "Medium",
        status: "Not Started",
        startDate: "",
        endDate: ""
    })
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (task) {
            setFormData({
                name: task.name,
                description: task.description || "",
                priority: task.priority,
                status: task.status,
                startDate: task.startDate ? new Date(task.startDate).toISOString().split('T')[0] : "",
                endDate: task.endDate ? new Date(task.endDate).toISOString().split('T')[0] : ""
            })
        }
    }, [task])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!task) return

        setIsLoading(true)

        try {
            const res = await api.patch(`/tasks/${task._id}`, formData)

            if (res.data.success) {
                toast.success("Task updated successfully")
                onTaskUpdated()
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update task")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                    <DialogDescription>
                        Update details for <span className="font-semibold">{task?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Task Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="priority">Priority</Label>
                            <Select onValueChange={(val) => handleSelectChange("priority", val)} value={formData.priority}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Low">Low</SelectItem>
                                    <SelectItem value="Medium">Medium</SelectItem>
                                    <SelectItem value="High">High</SelectItem>
                                    <SelectItem value="Critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select onValueChange={(val) => handleSelectChange("status", val)} value={formData.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Not Started">Not Started</SelectItem>
                                    <SelectItem value="In Progress">In Progress</SelectItem>
                                    <SelectItem value="On Hold">On Hold</SelectItem>
                                    <SelectItem value="Completed">Completed</SelectItem>
                                    <SelectItem value="Cancelled">Cancelled</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startDate">Start Date</Label>
                            <Input
                                id="startDate"
                                name="startDate"
                                type="date"
                                value={formData.startDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endDate">End Date</Label>
                            <Input
                                id="endDate"
                                name="endDate"
                                type="date"
                                value={formData.endDate}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
