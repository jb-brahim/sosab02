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

interface CreateMaterialDialogProps {
    projectId: string
    onMaterialCreated: () => void
    disabled?: boolean
}

const UNITS = ['kg', 'ton', 'm', 'm²', 'm³', 'piece', 'box', 'bag', 'liter']

export function CreateMaterialDialog({ projectId, onMaterialCreated, disabled }: CreateMaterialDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        unit: "",
        price: "",
        stockQuantity: "",
        supplier: ""
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        // If projectId is empty string, it means we are adding to Depot (no project)
        // Adjust check:
        // if (!projectId) { ... } -> Removed to allow Depot creation

        setIsLoading(true)

        try {
            const payload: any = {
                ...formData,
                price: parseFloat(formData.price),
                stockQuantity: parseInt(formData.stockQuantity) || 0
            }

            // Only add projectId if it's set and not empty.
            if (projectId && projectId.trim() !== '') {
                payload.projectId = projectId;
            }

            const res = await api.post("/materials", payload)

            if (res.data.success) {
                toast.success("Material added successfully")
                setOpen(false)
                onMaterialCreated()
                setFormData({
                    name: "",
                    category: "",
                    unit: "",
                    price: "",
                    stockQuantity: "",
                    supplier: ""
                })
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add material")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={disabled}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add Material</DialogTitle>
                    <DialogDescription>
                        Add a new item to the project inventory.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Material Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Cement"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                name="category"
                                placeholder="e.g. Raw Materials"
                                value={formData.category}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Select onValueChange={(val) => handleSelectChange("unit", val)} required>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select unit" />
                                </SelectTrigger>
                                <SelectContent>
                                    {UNITS.map(u => (
                                        <SelectItem key={u} value={u}>{u}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="price">Unit Price (TND)</Label>
                            <Input
                                id="price"
                                name="price"
                                type="number"
                                min="0"
                                step="0.01"
                                placeholder="0.00"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stockQuantity">Initial Stock</Label>
                            <Input
                                id="stockQuantity"
                                name="stockQuantity"
                                type="number"
                                min="0"
                                placeholder="0"
                                value={formData.stockQuantity}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="supplier">Supplier</Label>
                        <Input
                            id="supplier"
                            name="supplier"
                            placeholder="Supplier name (optional)"
                            value={formData.supplier}
                            onChange={handleChange}
                        />
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Material
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
