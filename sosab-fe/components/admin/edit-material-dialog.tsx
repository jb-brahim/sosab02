"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Plus } from "lucide-react"
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

const UNITS = ['kg', 'ton', 'm', 'm²', 'm³', 'piece', 'box', 'bag', 'liter', 'unité', 'sac']

export function EditMaterialDialog({ material, open, onOpenChange, onMaterialUpdated }: EditMaterialDialogProps) {
    const [isLoading, setIsLoading] = useState(false)
    const [categories, setCategories] = useState<string[]>([])
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")

    const [formData, setFormData] = useState({
        name: "",
        category: "",
        unit: "",
        price: "",
        stockQuantity: "",
        supplier: ""
    })

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/materials/categories')
                if (res.data.success) {
                    setCategories(res.data.data)
                }
            } catch (error) {
                console.error("Failed to load categories", error)
            }
        }
        if (open) {
            fetchCategories()
        }
    }, [open])

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
            setIsCreatingCategory(false)
            setNewCategoryName("")
        }
    }, [material])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSelectChange = (name: string, value: string) => {
        if (name === "category" && value === "__new__") {
            setIsCreatingCategory(true)
            return
        }
        setFormData({ ...formData, [name]: value })
    }

    const handleCreateCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error("Please enter a category/family name")
            return
        }
        try {
            const res = await api.post('/materials/categories', { name: newCategoryName.trim() })
            if (res.data.success) {
                const createdName = res.data.data.name
                setCategories(prev => Array.from(new Set([...prev, createdName])).sort())
                setFormData(prev => ({ ...prev, category: createdName }))
                setIsCreatingCategory(false)
                setNewCategoryName("")
                toast.success(`Family "${createdName}" created successfully!`)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create category")
        }
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
                    <DialogTitle>Modifier le Matériau</DialogTitle>
                    <DialogDescription>
                        Modifier les détails ou changer la famille du matériau.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nom du Matériau</Label>
                        <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    {/* Category / Family Selection */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="category">Famille / Catégorie</Label>
                            {!isCreatingCategory && (
                                <button
                                    type="button"
                                    onClick={() => setIsCreatingCategory(true)}
                                    className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
                                >
                                    <Plus className="w-3 h-3" />
                                    Nouvelle famille
                                </button>
                            )}
                        </div>

                        {isCreatingCategory ? (
                            <div className="flex items-center gap-2">
                                <Input
                                    placeholder="Nom de la nouvelle famille..."
                                    value={newCategoryName}
                                    onChange={(e) => setNewCategoryName(e.target.value)}
                                    className="h-10 text-sm"
                                />
                                <Button type="button" size="sm" onClick={handleCreateCategory}>
                                    Ajouter
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setIsCreatingCategory(false)
                                        setNewCategoryName("")
                                    }}
                                >
                                    Annuler
                                </Button>
                            </div>
                        ) : (
                            <Select
                                value={formData.category}
                                onValueChange={(val) => handleSelectChange("category", val)}
                            >
                                <SelectTrigger className="h-10">
                                    <SelectValue placeholder="Sélectionner une famille" />
                                </SelectTrigger>
                                <SelectContent>
                                    {categories.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            📂 {cat}
                                        </SelectItem>
                                    ))}
                                    <SelectItem value="__new__" className="text-primary font-bold">
                                        + Créer une nouvelle famille...
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="unit">Unité</Label>
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
                        <div className="space-y-2">
                            <Label htmlFor="price">Prix unitaire (DT)</Label>
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
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="stockQuantity">Quantité en Stock</Label>
                            <Input
                                id="stockQuantity"
                                name="stockQuantity"
                                type="number"
                                min="0"
                                value={formData.stockQuantity}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="supplier">Fournisseur</Label>
                            <Input
                                id="supplier"
                                name="supplier"
                                placeholder="Nom du fournisseur (optionnel)"
                                value={formData.supplier}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Enregistrer
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
