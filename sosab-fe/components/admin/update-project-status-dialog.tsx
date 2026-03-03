"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

interface Project {
    _id: string
    name: string
    status: string
    managers?: any[]
}

interface UpdateProjectStatusDialogProps {
    project: Project | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onStatusUpdated: () => void
}

export function UpdateProjectStatusDialog({ project, open, onOpenChange, onStatusUpdated }: UpdateProjectStatusDialogProps) {
    const [formData, setFormData] = useState({
        status: "Active",
    })
    const [selectedManagers, setSelectedManagers] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [users, setUsers] = useState<any[]>([])

    useEffect(() => {
        if (project) {
            setFormData({
                status: project.status,
            })
            // Pre-select existing managers
            if (project.managers && Array.isArray(project.managers)) {
                setSelectedManagers(project.managers.map((m: any) =>
                    typeof m === 'object' ? m._id : m
                ))
            } else {
                setSelectedManagers([])
            }
        }

        if (open) {
            fetchUsers()
        }
    }, [project, open])

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users")
            if (res.data.success) {
                setUsers(res.data.data)
            }
        } catch (error) {
            toast.error("Failed to load users")
        }
    }

    const handleManagerToggle = (userId: string) => {
        setSelectedManagers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!project) return

        setIsLoading(true)
        try {
            const res = await api.patch(`/projects/${project._id}`, {
                ...formData,
                managers: selectedManagers
            })
            if (res.data.success) {
                toast.success("Project updated successfully")
                onStatusUpdated()
                onOpenChange(false)
            }
        } catch (error: any) {
            console.error(error)
            toast.error(error.response?.data?.message || "Failed to update project")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Project</DialogTitle>
                    <DialogDescription>
                        Update details for project <span className="font-semibold">{project?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                            value={formData.status}
                            onValueChange={(val) => setFormData({ ...formData, status: val })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Planning">Planning</SelectItem>
                                <SelectItem value="Active">Active</SelectItem>
                                <SelectItem value="On Hold">On Hold</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label>Project Managers</Label>
                        <div className="border rounded-md p-2 max-h-40 overflow-y-auto space-y-1 bg-background">
                            {users.filter(u => u.role === 'Project Manager').map(u => (
                                <label key={u._id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 rounded p-1">
                                    <input
                                        type="checkbox"
                                        checked={selectedManagers.includes(u._id)}
                                        onChange={() => handleManagerToggle(u._id)}
                                        className="accent-primary"
                                    />
                                    <span className="text-sm">{u.name}</span>
                                </label>
                            ))}
                            {users.filter(u => u.role === 'Project Manager').length === 0 && (
                                <p className="text-sm text-muted-foreground p-1">No project managers found</p>
                            )}
                        </div>
                        {selectedManagers.length > 0 && (
                            <p className="text-xs text-muted-foreground">{selectedManagers.length} manager(s) selected</p>
                        )}
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
