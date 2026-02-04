"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import dynamic from 'next/dynamic'
import { Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"

// Dynamically import MapPicker to avoid SSR issues with Leaflet
const MapPicker = dynamic(() => import('@/components/ui/map-picker'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full flex items-center justify-center bg-muted">Loading Map...</div>
})

interface UpdateLocationDialogProps {
    project: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onLocationUpdated: () => void
}

export function UpdateLocationDialog({ project, open, onOpenChange, onLocationUpdated }: UpdateLocationDialogProps) {
    const [loading, setLoading] = useState(false)
    const [coordinates, setCoordinates] = useState<{ lat: number, lng: number } | null>(
        project?.coordinates ? project.coordinates : null
    )
    const [locationName, setLocationName] = useState<string>("")

    const handleSubmit = async () => {
        if (!coordinates) return

        try {
            setLoading(true)
            const payload: any = { coordinates }
            // Only update location name if we have a new one from the map picker
            if (locationName) {
                payload.location = locationName
            }

            console.log("SENDING UPDATE PAYLOAD:", payload) // Debug log

            const res = await api.patch(`/projects/${project._id}`, payload)

            if (res.data.success) {
                toast.success("Location updated successfully")
                onLocationUpdated()
                onOpenChange(false)
            }
        } catch (error) {
            toast.error("Failed to update location")
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>Update Project Location</DialogTitle>
                    <DialogDescription>
                        Click on the map to pinpoint the exact location of the project site.
                        This will ensure weather data is accurate.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <MapPicker
                        initialLat={project?.coordinates?.lat}
                        initialLng={project?.coordinates?.lng}
                        onLocationSelect={(lat, lng, address) => {
                            setCoordinates({ lat, lng })
                            if (address) setLocationName(address)
                        }}
                    />
                    {coordinates && (
                        <p className="text-xs text-muted-foreground mt-2 text-center">
                            Selected: {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
                        </p>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={loading || !coordinates}>
                        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Save Location
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
