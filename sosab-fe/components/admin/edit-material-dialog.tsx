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

interface Material {
    _id: string
    name: string
    category?: string
    unit: string
    price: number
    stockQuantity: number
    supplier?: string
}

interface EditMaterialDialogProps {
    material: Material | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onMaterialUpdated: () => void
}

const UNITS = ['kg', 'ton', 'm', 'm²', 'm³', 'piece', 'box', 'bag', 'liter']

export function EditMaterialDialog({ material, open, onOpenChange, onMaterialUpdated }: EditMaterialDialogProps) {
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        unit: "",
        price: "",
        stockQuantity: "",
        supplier: ""
    })

    useEffect(() => {
        if (material) {
            setFormData({
                name: material.name,
                category: material.category || "",
                unit: material.unit,
                price: material.price.toString(),
                stockQuantity: material.stockQuantity.toString(),
                supplier: material.supplier || ""
            })
        }
    }, [material])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        setFormData({ ...formData, [name]: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!material) return

        setIsLoading(true)

        try {
            const payload = {
                ...formData,
                price: parseFloat(formData.price),
                stockQuantity: parseInt(formData.stockQuantity) || 0
            }

            const res = await api.patch(`/materials/${material._id}`, payload)

            if (res.data.success) {
                toast.success("Material updated successfully")
                onMaterialUpdated()
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update material")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Material</DialogTitle>
                    <DialogDescription>
                        Update material details.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Material Name</Label>
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
                            <Label htmlFor="category">Category</Label>
                            <Input
                                id="category"
                                name="category"
                                value={formData.category}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unit</Label>
                            <Select onValueChange={(val) => handleSelectChange("unit", val)} value={formData.unit}>
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
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="stockQuantity">Stock Quantity</Label>
                            <Input
                                id="stockQuantity"
                                name="stockQuantity"
                                type="number"
                                min="0"
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
