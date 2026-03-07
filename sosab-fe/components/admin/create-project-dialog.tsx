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

import { useLanguage } from "@/lib/language-context"

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
    const { t } = useLanguage()

    // Coordinates state
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(null)

    const [formData, setFormData] = useState({
        name: "",
        location: "",
        startDate: "",
        endDate: "",
    })
    const [selectedManagers, setSelectedManagers] = useState<string[]>([])

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

    const handleManagerToggle = (userId: string) => {
        setSelectedManagers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
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
            const payload: any = {
                ...formData,
                budget: 0, // Set to 0 since it's removed from UI
                managers: selectedManagers
            }

            if (coordinates) {
                payload.coordinates = coordinates;
            }

            const res = await api.post("/projects", payload)

            if (res.data.success) {
                toast.success(t("projects.create_success") || "Project created successfully")
                setOpen(false)
                onProjectCreated()
                setFormData({
                    name: "",
                    location: "",
                    startDate: "",
                    endDate: "",
                })
                setSelectedManagers([])
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
                    {t("projects.new_project") || "New Project"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{t("projects.create_title") || "Create New Project"}</DialogTitle>
                    <DialogDescription>
                        {t("projects.create_description") || "Enter the details for the new construction project."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">{t("projects.project_name") || "Project Name"}</Label>
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
                        <Label>{t("projects.location_label") || "Location"}</Label>
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
                            <Label>{t("projects.managers") || "Project Managers"}</Label>
                            <div className="border rounded-md p-2 max-h-36 overflow-y-auto space-y-1 bg-background">
                                {loadingUsers ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                                ) : users.length === 0 ? (
                                    <div className="p-2 text-center text-sm text-muted-foreground">No users found</div>
                                ) : (
                                    users.filter(u => u.role === 'Project Manager').map((user) => (
                                        <label key={user._id} className="flex items-center gap-2 cursor-pointer hover:bg-muted/40 rounded p-1">
                                            <input
                                                type="checkbox"
                                                checked={selectedManagers.includes(user._id)}
                                                onChange={() => handleManagerToggle(user._id)}
                                                className="accent-primary"
                                            />
                                            <span className="text-sm">{user.name}</span>
                                        </label>
                                    ))
                                )}
                            </div>
                            {selectedManagers.length > 0 && (
                                <p className="text-xs text-muted-foreground">{selectedManagers.length} manager(s) selected</p>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Label htmlFor="startDate">{t("projects.start_date") || "Start Date"}</Label>
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
                                <Label htmlFor="endDate">{t("projects.end_date") || "End Date"}</Label>
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
                            {t("common.cancel") || "Cancel"}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {t("projects.create_project") || "Create Project"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
