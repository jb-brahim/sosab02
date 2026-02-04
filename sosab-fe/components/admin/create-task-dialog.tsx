"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

interface CreateTaskDialogProps {
    onTaskCreated: () => void
}

export function CreateTaskDialog({ onTaskCreated }: CreateTaskDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        projectId: "",
        priority: "Medium",
        status: "Not Started",
        startDate: "",
        endDate: ""
    })

    useEffect(() => {
        if (open) {
            fetchProjects()
        }
    }, [open])

    const fetchProjects = async () => {
        try {
            const res = await api.get("/projects")
            if (res.data.success) {
                setProjects(res.data.data)
            }
        } catch (error) {
            console.error(error)
            // Optional: don't toast on load error to avoid noise, or show user friendly message
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await api.post("/tasks", formData)

            if (res.data.success) {
                toast.success("Task created successfully")
                setOpen(false)
                onTaskCreated()
                setFormData({
                    name: "",
                    description: "",
                    projectId: "",
                    priority: "Medium",
                    status: "Not Started",
                    startDate: "",
                    endDate: ""
                })
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create task")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Task
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Task</DialogTitle>
                    <DialogDescription>
                        Create a new task and assign it to a project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Task Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Foundation Work"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="projectId">Project</Label>
                        <Select onValueChange={(val) => handleSelectChange("projectId", val)} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map(p => (
                                    <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

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
                            placeholder="Task details..."
                            value={formData.description}
                            onChange={handleChange}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Task
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
