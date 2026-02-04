"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, Map as MapIcon } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import dynamic from 'next/dynamic'

// Dynamically import MapPicker
const MapPicker = dynamic(() => import('@/components/ui/map-picker'), {
    ssr: false,
    loading: () => <div className="h-[200px] w-full flex items-center justify-center bg-muted">Loading Map...</div>
})

interface User {
    _id: string
    name: string
    role: string
}

interface CreateProjectDialogProps {
    onProjectCreated: () => void
}

export function CreateProjectDialog({ onProjectCreated }: CreateProjectDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [showMap, setShowMap] = useState(false)

    // Coordinates state
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        location: "",
        budget: "",
        startDate: "",
        endDate: "",
        managerId: "",
    })

    useEffect(() => {
        if (open) {
            fetchUsers()
        }
    }, [open])

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true)
            const res = await api.get("/users")
            if (res.data.success) {
                setUsers(res.data.data)
            }
        } catch (error) {
            toast.error("Failed to load users")
        } finally {
            setLoadingUsers(false)
        }
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleManagerChange = (value: string) => {
        setFormData({ ...formData, managerId: value })
    }

    const handleLocationSelect = (lat: number, lng: number, address?: string) => {
        setCoordinates({ lat, lng })
        if (address) {
            setFormData(prev => ({ ...prev, location: address }))
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const payload = {
                ...formData,
                budget: Number(formData.budget),
                coordinates: coordinates // Attach coordinates
            }

            const res = await api.post("/projects", payload)

            if (res.data.success) {
                toast.success("Project created successfully")
                setOpen(false)
                onProjectCreated()
                setFormData({
                    name: "",
                    location: "",
                    budget: "",
                    startDate: "",
                    endDate: "",
                    managerId: "",
                })
                setCoordinates(null)
                setShowMap(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create project")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    New Project
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Project</DialogTitle>
                    <DialogDescription>
                        Enter the details for the new construction project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Project Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="e.g. Villaji Complex"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="budget">Budget (TND)</Label>
                            <Input
                                id="budget"
                                name="budget"
                                type="number"
                                min="0"
                                placeholder="0.00"
                                value={formData.budget}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Location</Label>
                        <div className="flex gap-2">
                            <Input
                                id="location"
                                name="location"
                                placeholder="Project Address / Title"
                                value={formData.location}
                                onChange={handleChange}
                                required
                            />
                            <Button
                                type="button"
                                variant={showMap ? "secondary" : "outline"}
                                onClick={() => setShowMap(!showMap)}
                                title="Pick location on map"
                            >
                                <MapIcon className="h-4 w-4" />
                            </Button>
                        </div>

                        {showMap && (
                            <div className="border rounded-md p-2 bg-muted/20 animate-in slide-in-from-top-2 duration-200">
                                <p className="text-xs text-muted-foreground mb-2">
                                    Search by name or coordinates (e.g. 36.8, 10.1):
                                </p>
                                <MapPicker
                                    onLocationSelect={handleLocationSelect}
                                />
                                {coordinates && (
                                    <p className="text-xs text-green-600 mt-1 font-medium">
                                        ✓ Location selected: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="manager">Project Manager</Label>
                            <Select onValueChange={handleManagerChange} value={formData.managerId} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select manager" />
                                </SelectTrigger>
                                <SelectContent>
                                    {loadingUsers ? (
                                        <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                                    ) : users.length === 0 ? (
                                        <div className="p-2 text-center text-sm text-muted-foreground">No users found</div>
                                    ) : (
                                        users.map((user) => (
                                            <SelectItem key={user._id} value={user._id}>
                                                {user.name}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
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
                    </div>

                    <DialogFooter className="mt-6">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Create Project
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
