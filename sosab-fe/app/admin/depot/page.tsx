"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Warehouse, MoreHorizontal, Plus } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateMaterialDialog } from "@/components/admin/create-material-dialog"
import { EditMaterialDialog } from "@/components/admin/edit-material-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"

interface Material {
    _id: string
    name: string
    unit: string
    stockQuantity: number
    price: number
    category?: string
    supplier?: string
}

export default function DepotPage() {
    const [materials, setMaterials] = useState<Material[]>([])
    const [isLoading, setIsLoading] = useState(false)

    // Action states
    const [selectedMaterial, setSelectedMaterial] = useState<Material | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const fetchMaterials = async () => {
        setIsLoading(true)
        try {
            const res = await api.get("/materials/depot/all")
            if (res.data.success) {
                setMaterials(res.data.data)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch depot materials")
            setMaterials([])
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchMaterials()
    }, [])

    const handleDelete = async () => {
        if (!selectedMaterial) return
        try {
            const res = await api.delete(`/materials/${selectedMaterial._id}`)
            if (res.data.success) {
                toast.success("Material deleted from depot")
                fetchMaterials()
                setDeleteDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete material")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Central Depot</h1>
                    <p className="text-muted-foreground mt-1">Manage central warehouse inventory.</p>
                </div>
                <div className="flex gap-4">
                    {/* Hacky way to reuse CreateMaterialDialog without projectId - we need to handle this backend side or update the component. 
                        Actually, update CreateMaterialDialog to handle null projectId is better. 
                        For now let's modify CreateMaterialDialog lightly using `projectId=""` and ensure backend handles it?
                        Wait, my `CreateMaterialDialog` requires projectId to be string.
                        I will pass a dummy value or modify the component.
                        Let's modify `CreateMaterialDialog` to allow optional projectId, or handle "depot" logic.
                        Actually, I'll update it separately. For now let's put it there and fix it in a moment.
                    */}
                    <CreateMaterialDialog
                        projectId="" // Empty string as signal for Depot?
                        onMaterialCreated={fetchMaterials}
                        disabled={false}
                    />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Warehouse className="h-5 w-5 text-primary" />
                        Depot Inventory
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Material Name</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Available Stock</TableHead>
                                    <TableHead>Unit Price</TableHead>
                                    <TableHead>Unit</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {materials.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center h-24 text-muted-foreground">
                                            No materials in Depot.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    materials.map((m) => (
                                        <TableRow key={m._id}>
                                            <TableCell className="font-medium">{m.name}</TableCell>
                                            <TableCell>{m.category || "-"}</TableCell>
                                            <TableCell>{m.supplier || "-"}</TableCell>
                                            <TableCell>
                                                <Badge variant={m.stockQuantity > 0 ? "outline" : "destructive"}>
                                                    {m.stockQuantity}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>{m.price} TND</TableCell>
                                            <TableCell>{m.unit}</TableCell>
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => {
                                                            setSelectedMaterial(m)
                                                            setEditDialogOpen(true)
                                                        }}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive"
                                                            onClick={() => {
                                                                setSelectedMaterial(m)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <EditMaterialDialog
                material={selectedMaterial}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onMaterialUpdated={fetchMaterials}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the material
                            <span className="font-semibold"> {selectedMaterial?.name} </span>
                            from the central depot.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Delete Material
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
