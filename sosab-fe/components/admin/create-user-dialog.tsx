"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

interface CreateUserDialogProps {
    onUserCreated: () => void
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRoleChange = (value: string) => {
        setFormData({ ...formData, role: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await api.post("/users", formData)

            if (res.data.success) {
                toast.success("User created successfully")
                setOpen(false)
                onUserCreated()
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "",
                })
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create user")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add User
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>
                        Create a new user account with specific role and access.
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
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role">Role</Label>
                        <Select onValueChange={handleRoleChange} required>
                            <SelectTrigger>
                                <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Project Manager">Project Manager</SelectItem>
                                <SelectItem value="Accountant">Accountant</SelectItem>
                                <SelectItem value="Worker">Worker</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create User
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
