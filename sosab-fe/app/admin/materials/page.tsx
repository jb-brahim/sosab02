"use client"

import { useEffect, useState, useMemo } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Package, MoreHorizontal, Search, Filter, X, ArrowUpDown } from "lucide-react"
import { toast } from "sonner"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { CreateMaterialDialog } from "@/components/admin/create-material-dialog"
import { EditMaterialDialog } from "@/components/admin/edit-material-dialog"
import { RequestMaterialDialog } from "@/components/admin/request-material-dialog"
import { TransferMaterialDialog } from "@/components/admin/transfer-material-dialog"

interface Project {
    _id: string
    name: string
}

interface Material {
    materialId: string
    name: string
    unit: string
    stockQuantity: number
    price: number
    category?: string
    supplier?: string
    projectName?: string
    projectId?: string
    totalIn: number
    totalOut: number
}

export default function MaterialsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [materials, setMaterials] = useState<Material[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Filters & Search
    const [searchTerm, setSearchTerm] = useState("")
    const [filterProject, setFilterProject] = useState("all")
    const [filterSupplier, setFilterSupplier] = useState("all")

    // Action states
    const [selectedMaterial, setSelectedMaterial] = useState<any | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const fetchAllData = async () => {
        setIsLoading(true)
        try {
            const [projectsRes, materialsRes] = await Promise.all([
                api.get("/projects"),
                api.get("/materials/manager/summary")
            ])

            if (projectsRes.data.success) setProjects(projectsRes.data.data)
            if (materialsRes.data.success) setMaterials(materialsRes.data.data)

        } catch (error: any) {
            toast.error("Failed to load inventory data")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchAllData()
    }, [])

    // Computed unique suppliers for filter
    const uniqueSuppliers = useMemo(() => {
        const suppliers = new Set(materials.map(m => m.supplier || "Unknown"))
        return Array.from(suppliers).sort()
    }, [materials])

    // Filtered Materials
    const filteredMaterials = useMemo(() => {
        return materials.filter(m => {
            const matchesSearch = searchTerm === "" ||
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.supplier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (m.projectName || "").toLowerCase().includes(searchTerm.toLowerCase());

            const matchesProject = filterProject === "all" || m.projectId === filterProject;
            const matchesSupplier = filterSupplier === "all" || m.supplier === filterSupplier;

            return matchesSearch && matchesProject && matchesSupplier;
        })
    }, [materials, searchTerm, filterProject, filterSupplier])

    const handleDelete = async () => {
        if (!selectedMaterial) return
        try {
            const res = await api.delete(`/materials/item/${selectedMaterial.materialId}`)
            if (res.data.success) {
                toast.success("Material deleted successfully")
                fetchAllData()
                setDeleteDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete material")
        }
    }

    const resetFilters = () => {
        setSearchTerm("")
        setFilterProject("all")
        setFilterSupplier("all")
    }

    return (
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="font-display text-4xl font-bold tracking-tight text-foreground/90">Materials Inventory</h1>
                    <p className="text-muted-foreground mt-1 text-base">Global inventory control across all construction projects.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                    <CreateMaterialDialog
                        projectId={filterProject !== "all" ? filterProject : ""}
                        onMaterialCreated={fetchAllData}
                        disabled={false}
                    />
                    <TransferMaterialDialog
                        projects={projects}
                        onTransferComplete={fetchAllData}
                    />
                </div>
            </div>

            <Card className="border-border/50 shadow-sm overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50 p-6">
                    <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full lg:max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by name, category, supplier or project..."
                                className="pl-10 h-11 bg-background border-border/50 rounded-xl"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                            <div className="flex items-center gap-2 bg-background border border-border/50 rounded-xl px-3 py-1 h-11">
                                <Filter className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm font-medium border-r pr-3 mr-1 text-muted-foreground">Filters</span>

                                <Select value={filterProject} onValueChange={setFilterProject}>
                                    <SelectTrigger className="w-[160px] border-none shadow-none focus:ring-0 h-8">
                                        <SelectValue placeholder="Project" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Projects</SelectItem>
                                        {projects.map((p) => (
                                            <SelectItem key={p._id} value={p._id}>{p.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <span className="text-muted-foreground/30 px-1">|</span>

                                <Select value={filterSupplier} onValueChange={setFilterSupplier}>
                                    <SelectTrigger className="w-[160px] border-none shadow-none focus:ring-0 h-8">
                                        <SelectValue placeholder="Supplier" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Suppliers</SelectItem>
                                        {uniqueSuppliers.map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            {(filterProject !== "all" || filterSupplier !== "all" || searchTerm !== "") && (
                                <Button variant="ghost" size="sm" onClick={resetFilters} className="text-muted-foreground hover:text-foreground h-11 rounded-xl">
                                    Clear all
                                </Button>
                            )}
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/10">
                            <TableRow className="border-border/50 hover:bg-transparent">
                                <TableHead className="w-[300px] py-4">
                                    <div className="flex items-center gap-2">Material Name <ArrowUpDown className="h-3 w-3 opacity-50" /></div>
                                </TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Project</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead className="text-center">Stock Level</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Unit</TableHead>
                                <TableHead className="text-right pr-6">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={8} className="p-0">
                                            <div className="h-16 w-full animate-pulse bg-muted/50 border-b border-border/50" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : filteredMaterials.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="h-60 text-center">
                                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                                            <Package className="h-12 w-12 opacity-10 mb-4" />
                                            <p className="text-lg font-medium">No materials found</p>
                                            <p className="text-sm opacity-70">Try adjusting your filters or search term.</p>
                                            <Button variant="link" onClick={resetFilters} className="mt-2">Reset all filters</Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMaterials.map((m) => (
                                    <TableRow key={m.materialId} className="group hover:bg-muted/20 border-border/40 transition-colors">
                                        <TableCell className="py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10">
                                                    <Package className="h-5 w-5" />
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-foreground/90">{m.name}</span>
                                                    <span className="text-[10px] uppercase font-black text-muted-foreground opacity-60 tracking-wider">ID: {m.materialId.slice(-6)}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-700 font-semibold rounded-md border-none">
                                                {m.category || "Standard"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1.5 font-medium text-sm text-foreground/70">
                                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                                {m.projectName || "N/A"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm italic">{m.supplier || "Unknown"}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="inline-flex flex-col items-center">
                                                <Badge variant={m.stockQuantity > 5 ? "outline" : "destructive"} className="px-3 rounded-lg font-bold">
                                                    {m.stockQuantity}
                                                </Badge>
                                                <div className="text-[9px] mt-1 text-muted-foreground uppercase font-bold opacity-50">Available</div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-bold text-foreground/80">
                                                {new Intl.NumberFormat('fr-TN', { minimumFractionDigits: 3 }).format(m.price)}
                                                <span className="text-[10px] ml-1 text-muted-foreground">TND</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="bg-muted px-2 py-1 rounded text-xs font-mono font-bold text-muted-foreground">{m.unit}</span>
                                        </TableCell>
                                        <TableCell className="text-right pr-4">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <MoreHorizontal className="h-5 w-5" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-border/50 p-2">
                                                    <DropdownMenuItem onClick={() => {
                                                        setSelectedMaterial({ ...m, _id: m.materialId })
                                                        setEditDialogOpen(true)
                                                    }} className="rounded-lg py-2">
                                                        Edit Material Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-destructive rounded-lg py-2"
                                                        onClick={() => {
                                                            setSelectedMaterial(m)
                                                            setDeleteDialogOpen(true)
                                                        }}
                                                    >
                                                        Delete from Inventory
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <EditMaterialDialog
                material={selectedMaterial}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onMaterialUpdated={fetchAllData}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent className="rounded-2xl border-border/50">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-2xl font-bold font-display">Confirm Deletion</AlertDialogTitle>
                        <AlertDialogDescription className="text-base text-muted-foreground mt-2">
                            This action cannot be undone. This will permanently delete
                            <span className="font-bold text-foreground"> {selectedMaterial?.name} </span>
                            from the inventory of <span className="font-bold text-foreground">{selectedMaterial?.projectName}</span>.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="mt-6">
                        <AlertDialogCancel className="rounded-xl h-12">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl h-12 px-6">
                            Delete Material
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
