"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, ArrowRightLeft } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

interface RequestMaterialDialogProps {
    projectId: string
    onRequestCreated: () => void
    disabled?: boolean
}

export function RequestMaterialDialog({ projectId, onRequestCreated, disabled }: RequestMaterialDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [depotMaterials, setDepotMaterials] = useState<any[]>([])

    const [formData, setFormData] = useState({
        materialId: "",
        quantity: ""
    })

    useEffect(() => {
        if (open) {
            fetchDepotMaterials()
        }
    }, [open])

    const fetchDepotMaterials = async () => {
        try {
            const res = await api.get("/materials/depot/all")
            if (res.data.success) {
                setDepotMaterials(res.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch depot materials", error)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!projectId) {
            toast.error("No project selected")
            return
        }

        setIsLoading(true)

        try {
            const payload = {
                projectId,
                materialId: formData.materialId,
                quantity: parseInt(formData.quantity)
            }

            const res = await api.post("/material-requests", payload)

            if (res.data.success) {
                toast.success("Request submitted successfully")
                setOpen(false)
                onRequestCreated()
                setFormData({
                    materialId: "",
                    quantity: ""
                })
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to submit request")
        } finally {
            setIsLoading(false)
        }
    }

    const selectedMaterial = depotMaterials.find(m => m._id === formData.materialId)

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" disabled={disabled}>
                    <ArrowRightLeft className="mr-2 h-4 w-4" />
                    Request from Depot
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Request Material</DialogTitle>
                    <DialogDescription>
                        Request materials from the central Depot to be transferred to this project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="material">Select Material</Label>
                        <Select
                            onValueChange={(val) => setFormData({ ...formData, materialId: val })}
                            value={formData.materialId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select material from Depot" />
                            </SelectTrigger>
                            <SelectContent>
                                {depotMaterials.map(m => (
                                    <SelectItem key={m._id} value={m._id} disabled={m.stockQuantity <= 0}>
                                        {m.name} ({m.stockQuantity} {m.unit} available)
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {selectedMaterial && (
                        <div className="p-3 bg-muted rounded-md text-sm">
                            <p><strong>Available Stock:</strong> {selectedMaterial.stockQuantity} {selectedMaterial.unit}</p>
                            <p><strong>Supplier:</strong> {selectedMaterial.supplier || "N/A"}</p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity Required</Label>
                        <Input
                            id="quantity"
                            type="number"
                            min="1"
                            placeholder="Enter quantity"
                            value={formData.quantity}
                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            required
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading || !formData.materialId || !formData.quantity}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
