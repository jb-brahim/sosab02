"use client"

import { useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ArrowRightLeft, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface Project {
    _id: string
    name: string
}

interface TransferMaterialDialogProps {
    projects: Project[]
    onTransferComplete: () => void
}

export function TransferMaterialDialog({ projects, onTransferComplete }: TransferMaterialDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        sourceProjectId: "",
        targetProjectId: "",
        materialName: "",
        quantity: "",
        notes: ""
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!formData.sourceProjectId || !formData.targetProjectId || !formData.materialName || !formData.quantity) {
            toast.error("Please fill all required fields")
            return
        }

        if (formData.sourceProjectId === formData.targetProjectId) {
            toast.error("Source and target projects must be different")
            return
        }

        setIsLoading(true)
        try {
            const res = await api.post("/materials/transfer", formData)
            if (res.data.success) {
                toast.success(res.data.message || "Material transferred successfully")
                setOpen(false)
                setFormData({ sourceProjectId: "", targetProjectId: "", materialName: "", quantity: "", notes: "" })
                onTransferComplete()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Transfer failed")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <ArrowRightLeft className="h-4 w-4" />
                    Transférer Stock
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Transférer du Matériel</DialogTitle>
                        <DialogDescription>
                            Déplacer du stock d'un projet à un autre (Crée un mouvement OUT et un mouvement IN).
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="sourceProject">Projet Source</Label>
                            <Select
                                value={formData.sourceProjectId}
                                onValueChange={(val) => setFormData({ ...formData, sourceProjectId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner source" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="targetProject">Projet Cible</Label>
                            <Select
                                value={formData.targetProjectId}
                                onValueChange={(val) => setFormData({ ...formData, targetProjectId: val })}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Sélectionner destination" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="materialName">Nom du Matériau (Exact)</Label>
                            <Input
                                id="materialName"
                                placeholder="ex: Ciment"
                                value={formData.materialName}
                                onChange={(e) => setFormData({ ...formData, materialName: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="quantity">Quantité à Transférer</Label>
                            <Input
                                id="quantity"
                                type="number"
                                placeholder="0"
                                value={formData.quantity}
                                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="notes">Notes (Optionnel)</Label>
                            <Input
                                id="notes"
                                placeholder="Raison du transfert..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Annuler
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirmer le Transfert"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
