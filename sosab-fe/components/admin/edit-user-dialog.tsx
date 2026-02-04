"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

interface User {
    _id: string
    name: string
    email: string
    role: string
}

interface EditUserDialogProps {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUserUpdated: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
    })

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
            })
        }
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRoleChange = (value: string) => {
        setFormData({ ...formData, role: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsLoading(true)

        try {
            const res = await api.patch(`/users/${user._id}`, formData)

            if (res.data.success) {
                toast.success("User updated successfully")
                onUserUpdated()
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update user")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit User Details</DialogTitle>
                    <DialogDescription>
                        Update information for <span className="font-semibold">{user?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select onValueChange={handleRoleChange} value={formData.role}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">Admin</SelectItem>
                                <SelectItem value="Project Manager">Project Manager</SelectItem>
                                <SelectItem value="Accountant">Accountant</SelectItem>
                                <SelectItem value="Worker">Worker</SelectItem>
                            </SelectContent>
                        </Select>
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
