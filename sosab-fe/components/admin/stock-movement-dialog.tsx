"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Minus, Loader2, Search, ArrowLeft, ArrowDownLeft, ArrowUpRight, Package, Box, Truck, User, FileText, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { MATERIAL_CATALOG } from "@/lib/material-catalog"
import { cn } from "@/lib/utils"

interface StockMovementDialogProps {
    projectId: string
    type: "IN" | "OUT"
    onSuccess: () => void
    locale?: "en" | "fr"
}

export function StockMovementDialog({ projectId, type, onSuccess, locale = "fr" }: StockMovementDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<"select" | "details">("select")
    
    // Project materials
    const [projectMaterials, setProjectMaterials] = useState<any[]>([])
    const [loadingMaterials, setLoadingMaterials] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")

    // Selected material info
    const [selectedMaterial, setSelectedMaterial] = useState<{
        name: string
        unit: string
        category: string
        isNew: boolean
        isCustom?: boolean
    } | null>(null)

    // Dynamic states for unit and category in details form
    const [customUnit, setCustomUnit] = useState("unité")
    const [customCategory, setCustomCategory] = useState("Standard")

    // Form inputs
    const [formData, setFormData] = useState({
        quantity: "",
        notes: "",
        supplier: "",
        deliveredBy: "",
        bonLivraison: ""
    })

    const inputRef = useRef<HTMLInputElement>(null)

    // Fetch existing materials in this project
    useEffect(() => {
        if (open) {
            const fetchProjectMaterials = async () => {
                try {
                    setLoadingMaterials(true)
                    const res = await api.get(`/materials/${projectId}`)
                    if (res.data.success) {
                        setProjectMaterials(res.data.data)
                    }
                } catch (err) {
                    console.error("Failed to load project materials", err)
                } finally {
                    setLoadingMaterials(false)
                }
            }
            fetchProjectMaterials()
            setTimeout(() => inputRef.current?.focus(), 150)
        }
    }, [open, projectId])

    // Filter project materials
    const matchedProjectMaterials = projectMaterials.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
    )

    // Filter catalog materials
    const matchedCatalogMaterials = searchQuery.trim() === ""
        ? []
        : MATERIAL_CATALOG.flatMap(cat =>
            cat.items.map(item => ({ ...item, classification: cat.classification }))
        ).filter(item =>
            item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
            // Exclude if already in matched project materials to avoid duplicates
            !projectMaterials.some(pm => pm.name.toLowerCase() === item.name.toLowerCase())
        ).slice(0, 5)

    const handleSelectMaterial = (name: string, unit: string, category: string, isNew: boolean, isCustom = false) => {
        setSelectedMaterial({ name, unit, category, isNew, isCustom })
        setCustomUnit(unit)
        setCustomCategory(category)
        setStep("details")
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!selectedMaterial) return

        // Frontend validation — mirrors backend requirements
        const qty = parseFloat(formData.quantity)
        if (!formData.quantity || isNaN(qty) || qty <= 0) {
            toast.error(locale === "fr" ? "Veuillez entrer une quantité valide (> 0)" : "Please enter a valid quantity (> 0)")
            return
        }
        if (!customUnit || customUnit.trim() === "") {
            toast.error(locale === "fr" ? "L'unité est requise" : "Unit is required")
            return
        }
        if (!selectedMaterial.name || selectedMaterial.name.trim() === "") {
            toast.error(locale === "fr" ? "Le nom du matériau est requis" : "Material name is required")
            return
        }

        setIsLoading(true)
        try {
            const res = await api.post("/materials/quick-log", {
                projectId,
                materialName: selectedMaterial.name.trim(),
                unit: customUnit.trim(),
                category: customCategory || "Standard",
                type,
                quantity: qty,
                notes: formData.notes,
                deliveredBy: type === "IN" ? formData.deliveredBy : undefined,
                supplier: type === "IN" ? formData.supplier : undefined,
                bonLivraison: type === "IN" ? formData.bonLivraison : undefined
            })

            if (res.data.success) {
                toast.success(
                    type === "IN" 
                        ? (locale === "fr" ? "Arrivage enregistré !" : "Arrival registered successfully!")
                        : (locale === "fr" ? "Sortie enregistrée !" : "Exit registered successfully!")
                )
                handleClose()
                onSuccess()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || (locale === "fr" ? "Échec de l'enregistrement" : "Failed to save entry"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setOpen(false)
        setTimeout(() => {
            setStep("select")
            setSearchQuery("")
            setSelectedMaterial(null)
            setCustomUnit("unité")
            setCustomCategory("Standard")
            setFormData({
                quantity: "",
                notes: "",
                supplier: "",
                deliveredBy: "",
                bonLivraison: ""
            })
        }, 300)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
            <DialogTrigger asChild>
                {type === "IN" ? (
                    <Button className="bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl gap-2 h-9 px-4 text-xs font-semibold shadow-md shadow-emerald-500/10">
                        <Plus className="h-4 w-4" />
                        {locale === "fr" ? "Arrivage" : "Stock In"}
                    </Button>
                ) : (
                    <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl gap-2 h-9 px-4 text-xs font-semibold shadow-md shadow-rose-500/10">
                        <Minus className="h-4 w-4" />
                        {locale === "fr" ? "Sortie" : "Stock Out"}
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent className={cn("transition-all duration-300", step === "details" && type === "IN" ? "sm:max-w-[480px]" : "sm:max-w-[420px]")}>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step === "details" && (
                            <button
                                type="button"
                                onClick={() => setStep("select")}
                                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        {type === "IN" ? (
                            <div className="flex items-center gap-2 text-emerald-500 font-bold">
                                <ArrowDownLeft className="h-5 w-5" />
                                <span>{locale === "fr" ? "Nouvel Arrivage (Entrée)" : "New Stock Arrival"}</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-rose-500 font-bold">
                                <ArrowUpRight className="h-5 w-5" />
                                <span>{locale === "fr" ? "Nouvelle Sortie (Départ)" : "New Stock Exit"}</span>
                            </div>
                        )}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "select" 
                            ? (locale === "fr" ? "Sélectionnez ou recherchez le matériau" : "Select or search for the material")
                            : (locale === "fr" ? `Mouvement de stock pour ${selectedMaterial?.name}` : `Stock logging details for ${selectedMaterial?.name}`)}
                    </DialogDescription>
                </DialogHeader>

                {/* STEP 1: SELECT MATERIAL */}
                {step === "select" && (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                placeholder={locale === "fr" ? "Rechercher un matériau par son nom..." : "Search material by name..."}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 rounded-xl border border-border"
                            />
                        </div>

                        <div className="max-h-[300px] overflow-y-auto space-y-4 pr-1">
                            {/* Materials already in this project */}
                            {matchedProjectMaterials.length > 0 && (
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500 px-3 mb-1">
                                        {locale === "fr" ? "Matériaux du projet" : "Project Materials"}
                                    </h4>
                                    {matchedProjectMaterials.map((m) => (
                                        <button
                                            key={m._id}
                                            type="button"
                                            onClick={() => handleSelectMaterial(m.name, m.unit, m.category || "Standard", false)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Package className="h-4 w-4 text-amber-500/80" />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{m.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase">{m.category || "Standard"}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md">
                                                    {m.stockQuantity} {m.unit}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-amber-500 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Catalog suggestions (can be added new to the project) */}
                            {matchedCatalogMaterials.length > 0 && (
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 px-3 mb-1 mt-2">
                                        {locale === "fr" ? "Catalogue global (Nouveau au projet)" : "Global Catalog (New to Project)"}
                                    </h4>
                                    {matchedCatalogMaterials.map((item, idx) => (
                                        <button
                                            key={`${item.name}-${idx}`}
                                            type="button"
                                            onClick={() => handleSelectMaterial(item.name, item.unit, item.classification, true)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors text-left group"
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Box className="h-4 w-4 text-emerald-500/80" />
                                                <div className="flex flex-col">
                                                    <span className="font-semibold">{item.name}</span>
                                                    <span className="text-[10px] text-muted-foreground font-bold mt-0.5 uppercase">{item.classification}</span>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md">
                                                    {item.unit}
                                                </span>
                                                <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Custom Material option if search query doesn't match completely */}
                            {searchQuery.trim() !== "" && (
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-500 px-3 mb-1 mt-2">
                                        {locale === "fr" ? "Matériau personnalisé" : "Custom Material"}
                                    </h4>
                                    <button
                                        type="button"
                                        onClick={() => handleSelectMaterial(searchQuery, "unité", "Standard", true, true)}
                                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-semibold bg-amber-500/10 text-amber-500 border border-dashed border-amber-500/30 hover:bg-amber-500/20 hover:border-amber-500/50 transition-colors text-left group animate-in fade-in zoom-in-95 duration-150"
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <Plus className="h-4 w-4 text-amber-500" />
                                            <span>{locale === "fr" ? `Créer & ajouter "${searchQuery}"` : `Create & add "${searchQuery}"`}</span>
                                        </div>
                                        <ChevronRight className="h-4 w-4 text-amber-500 font-bold" />
                                    </button>
                                </div>
                            )}

                            {matchedProjectMaterials.length === 0 && matchedCatalogMaterials.length === 0 && searchQuery.trim() === "" && (
                                <div className="text-center py-8 text-muted-foreground space-y-2">
                                    <Package className="h-8 w-8 mx-auto opacity-30" />
                                    <p className="text-sm">{locale === "fr" ? "Aucun matériau trouvé" : "No materials found"}</p>
                                    <p className="text-xs opacity-60">{locale === "fr" ? "Saisissez un nom pour créer un matériau personnalisé." : "Type a name to create a custom material."}</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* STEP 2: FILL IN DETAILS */}
                {step === "details" && selectedMaterial && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Current info badge */}
                        <div className="rounded-xl bg-muted/40 p-3 border border-border/40 text-xs space-y-1">
                            <div className="flex justify-between">
                                <span className="text-muted-foreground">{locale === "fr" ? "Matériau :" : "Material:"}</span>
                                <span className="font-bold text-foreground">{selectedMaterial.name}</span>
                            </div>
                            {!selectedMaterial.isCustom && (
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{locale === "fr" ? "Catégorie :" : "Category:"}</span>
                                    <span className="font-semibold">{selectedMaterial.category}</span>
                                </div>
                            )}
                            {selectedMaterial.isNew && !selectedMaterial.isCustom && (
                                <div className="text-[10px] font-bold text-emerald-500 uppercase tracking-wide mt-1 text-center">
                                    ✨ {locale === "fr" ? "Sera ajouté automatiquement au projet" : "Will be added auto-created in project"}
                                </div>
                            )}
                        </div>

                        {/* Custom editable unit and category if creating custom material */}
                        {selectedMaterial.isCustom && (
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-amber-500/5 border border-amber-500/25">
                                <div className="space-y-1.5 col-span-2">
                                    <div className="text-[10px] font-bold text-amber-500 uppercase tracking-wider text-center">
                                        ✨ Nouveau matériau personnalisé
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="custom-category" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {locale === "fr" ? "Catégorie" : "Category"}
                                    </Label>
                                    <select
                                        id="custom-category"
                                        value={customCategory}
                                        onChange={e => setCustomCategory(e.target.value)}
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    >
                                        {["Standard", "BÉTON", "LIANTS", "PRODUITS DE CARRIERE", "PRODUITS ROUGES", "ARMATURES", "Sable", "Agglos", "Divers"].map(c => (
                                            <option key={c} value={c}>{c}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="custom-unit" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        {locale === "fr" ? "Unité" : "Unit"}
                                    </Label>
                                    <input
                                        id="custom-unit"
                                        type="text"
                                        placeholder="Ex: sac, m³, kg"
                                        value={customUnit}
                                        onChange={e => setCustomUnit(e.target.value)}
                                        required
                                        className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Quantity input */}
                        <div className="space-y-2">
                            <Label htmlFor="mov-qty" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {locale === "fr" ? `Quantité (${customUnit})` : `Quantity (${customUnit})`}
                            </Label>
                            <Input
                                id="mov-qty"
                                type="number"
                                step="any"
                                min="0.001"
                                placeholder={locale === "fr" ? "Entrez la quantité" : "Enter quantity"}
                                value={formData.quantity}
                                onChange={e => setFormData({ ...formData, quantity: e.target.value })}
                                required
                                className="rounded-xl border border-border"
                            />
                        </div>

                        {/* IN-ONLY DELIVERY FIELDS */}
                        {type === "IN" && (
                            <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-muted/20 border border-border/40">
                                <div className="space-y-1.5">
                                    <Label htmlFor="mov-supplier" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Package className="h-3 w-3" />
                                        {locale === "fr" ? "Fournisseur" : "Supplier"}
                                    </Label>
                                    <Input
                                        id="mov-supplier"
                                        type="text"
                                        placeholder={locale === "fr" ? "Nom" : "Name"}
                                        value={formData.supplier}
                                        onChange={e => setFormData({ ...formData, supplier: e.target.value })}
                                        className="rounded-xl border border-border text-xs py-1 h-9"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor="mov-livreur" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <Truck className="h-3 w-3" />
                                        {locale === "fr" ? "Livreur" : "Livreur"}
                                    </Label>
                                    <Input
                                        id="mov-livreur"
                                        type="text"
                                        placeholder={locale === "fr" ? "Nom" : "Name"}
                                        value={formData.deliveredBy}
                                        onChange={e => setFormData({ ...formData, deliveredBy: e.target.value })}
                                        className="rounded-xl border border-border text-xs py-1 h-9"
                                    />
                                </div>
                                <div className="col-span-2 space-y-1.5">
                                    <Label htmlFor="mov-bon" className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                                        <FileText className="h-3 w-3" />
                                        {locale === "fr" ? "Bon de livraison" : "Delivery Slip #"}
                                    </Label>
                                    <Input
                                        id="mov-bon"
                                        type="text"
                                        placeholder={locale === "fr" ? "Numéro de bon" : "Slip number"}
                                        value={formData.bonLivraison}
                                        onChange={e => setFormData({ ...formData, bonLivraison: e.target.value })}
                                        className="rounded-xl border border-border text-xs py-1 h-9"
                                    />
                                </div>
                            </div>
                        )}

                        {/* Notes input */}
                        <div className="space-y-2">
                            <Label htmlFor="mov-notes" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {locale === "fr" ? "Notes (Optionnel)" : "Notes (Optional)"}
                            </Label>
                            <textarea
                                id="mov-notes"
                                placeholder={locale === "fr" ? "Détails supplémentaires..." : "Extra details..."}
                                value={formData.notes}
                                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full min-h-[70px] rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
                            />
                        </div>

                        <DialogFooter className="pt-2 gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => setStep("select")}>
                                {locale === "fr" ? "Retour" : "Back"}
                            </Button>
                            <Button
                                type="submit"
                                size="sm"
                                disabled={isLoading}
                                className={cn(
                                    "text-white font-medium",
                                    type === "IN"
                                        ? "bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-500/10"
                                        : "bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/10"
                                )}
                            >
                                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : (locale === "fr" ? "Confirmer" : "Confirm")}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
