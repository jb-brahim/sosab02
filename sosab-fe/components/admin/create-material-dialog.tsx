"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2, ChevronRight, Search, ArrowLeft, LayoutGrid, Package } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { MATERIAL_CATALOG, ALL_CLASSIFICATION_NAMES, type MaterialEntry } from "@/lib/material-catalog"

interface CreateMaterialDialogProps {
    projectId: string
    onMaterialCreated: () => void
    disabled?: boolean
    locale?: "en" | "fr"
    triggerLabel?: string
    triggerClassName?: string
}

type Step = "classification" | "material-pick" | "form"

const UNITS = ['kg', 'T', 'm', 'ml', 'm²', 'm³', 'U', 'L', 'box', 'bag', 'liter', 'unité', 'sac']

const LOCALIZED_TEXT = {
    en: {
        addMaterial: "Add Material",
        newMaterial: "New Material",
        materialDetails: "Material Details",
        searchClassification: "Search classification or material name…",
        noMatch: "No match found",
        chooseClassification: "Type or choose a category/material",
        chooseMaterial: "Choose a material or add a custom one",
        fillDetails: "Fill in the remaining details",
        autre: "Autre (custom material)",
        materialName: "Material Name",
        classification: "Family / Category",
        unit: "Unit",
        selectUnit: "Select unit",
        unitPrice: "Unit Price (TND)",
        initialStock: "Initial Stock",
        supplier: "Supplier",
        supplierOptional: "Supplier name (optional)",
        cancel: "Cancel",
        matchingMaterials: "Matching Materials",
        categories: "Categories"
    },
    fr: {
        addMaterial: "Ajouter un matériau",
        newMaterial: "Nouveau matériau",
        materialDetails: "Détails du matériau",
        searchClassification: "Rechercher une catégorie ou un matériau…",
        noMatch: "Aucune correspondance trouvée",
        chooseClassification: "Saisissez ou choisissez une catégorie ou un matériau",
        chooseMaterial: "Choisissez un matériau ou ajoutez-en un personnalisé",
        fillDetails: "Remplissez les détails restants",
        autre: "Autre (matériau personnalisé)",
        materialName: "Nom du matériau",
        classification: "Famille / Catégorie",
        unit: "Unité",
        selectUnit: "Sélectionner l'unité",
        unitPrice: "Prix unitaire (DT)",
        initialStock: "Quantité initiale",
        supplier: "Fournisseur",
        supplierOptional: "Nom du fournisseur (optionnel)",
        cancel: "Annuler",
        matchingMaterials: "Matériaux correspondants",
        categories: "Catégories"
    }
}

export function CreateMaterialDialog({ projectId, onMaterialCreated, disabled, locale = "en", triggerLabel, triggerClassName }: CreateMaterialDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<Step>("classification")
    const [categories, setCategories] = useState<string[]>([])
    const [isCreatingCategory, setIsCreatingCategory] = useState(false)
    const [newCategoryName, setNewCategoryName] = useState("")

    const t = LOCALIZED_TEXT[locale]

    // Step 1
    const [classQuery, setClassQuery] = useState("")
    const [selectedClassification, setSelectedClassification] = useState("")

    // Step 2 — manual "autre" override
    const [isAutre, setIsAutre] = useState(false)

    // Step 3 form data
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        unit: "",
        price: "",
        stockQuantity: "",
        supplier: ""
    })

    const inputRef = useRef<HTMLInputElement>(null)

    const fetchCategories = async () => {
        try {
            const res = await api.get('/materials/categories')
            if (res.data.success) {
                setCategories(res.data.data)
            }
        } catch (error) {
            console.error("Failed to fetch categories", error)
        }
    }

    useEffect(() => {
        if (open) {
            fetchCategories()
        }
    }, [open])

    const normalizeStr = (str: string) => (str || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    const normClassQuery = normalizeStr(classQuery)

    // Filter classification suggestions
    const suggestions = classQuery.trim() === ""
        ? ALL_CLASSIFICATION_NAMES
        : ALL_CLASSIFICATION_NAMES.filter(c =>
            normalizeStr(c).includes(normClassQuery)
        )

    // Filter matching materials inside the catalog directly
    const matchingMaterials = classQuery.trim() === ""
        ? []
        : MATERIAL_CATALOG.flatMap(cat =>
            cat.items.map(item => ({ ...item, classification: cat.classification }))
        ).filter(item =>
            normalizeStr(item.name).includes(normClassQuery) ||
            normalizeStr(item.classification).includes(normClassQuery)
        ).slice(0, 8)

    // Items under selected classification
    const classificationItems: MaterialEntry[] = MATERIAL_CATALOG.find(
        c => c.classification === selectedClassification
    )?.items ?? []

    const handleSelectClassification = (name: string) => {
        setSelectedClassification(name)
        setStep("material-pick")
        setIsAutre(false)
    }

    const handleSelectMaterial = (item: MaterialEntry) => {
        setFormData(prev => ({
            ...prev,
            name: item.name,
            unit: item.unit,
            category: selectedClassification,
        }))
        setStep("form")
    }

    const handleSelectDirectMaterial = (item: { name: string, unit: string, classification: string }) => {
        setFormData({
            name: item.name,
            unit: item.unit,
            category: item.classification,
            price: "",
            stockQuantity: "",
            supplier: ""
        })
        setIsAutre(false)
        setStep("form")
    }

    const handleAutre = () => {
        setIsAutre(true)
        setFormData(prev => ({
            ...prev,
            name: "",
            unit: "",
            category: selectedClassification || "Divers",
        }))
        setStep("form")
    }

    const handleCreateNewCategory = async () => {
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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)
        try {
            const payload: any = {
                ...formData,
                price: parseFloat(formData.price),
                stockQuantity: parseInt(formData.stockQuantity) || 0
            }
            if (projectId && projectId.trim() !== '') {
                payload.projectId = projectId
            }
            const res = await api.post("/materials", payload)
            if (res.data.success) {
                toast.success(locale === "fr" ? "Matériau ajouté avec succès" : "Material added successfully")
                handleClose()
                onMaterialCreated()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || (locale === "fr" ? "Échec de l'ajout du matériau" : "Failed to add material"))
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setOpen(false)
        setTimeout(() => {
            setStep("classification")
            setClassQuery("")
            setSelectedClassification("")
            setIsAutre(false)
            setIsCreatingCategory(false)
            setNewCategoryName("")
            setFormData({ name: "", category: "", unit: "", price: "", stockQuantity: "", supplier: "" })
        }, 300)
    }

    useEffect(() => {
        if (open && step === "classification") {
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [open, step])

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); else setOpen(true) }}>
            <DialogTrigger asChild>
                <Button disabled={disabled} className={triggerClassName}>
                    <Plus className="mr-2 h-4 w-4" />
                    {triggerLabel || t.addMaterial}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[460px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {step !== "classification" && (
                            <button
                                type="button"
                                onClick={() => setStep(step === "form" ? "material-pick" : "classification")}
                                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
                            >
                                <ArrowLeft className="h-4 w-4" />
                            </button>
                        )}
                        {step === "classification" && t.addMaterial}
                        {step === "material-pick" && selectedClassification}
                        {step === "form" && (isAutre ? t.newMaterial : formData.name || t.materialDetails)}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "classification" && t.chooseClassification}
                        {step === "material-pick" && t.chooseMaterial}
                        {step === "form" && t.fillDetails}
                    </DialogDescription>
                </DialogHeader>

                {/* ── STEP 1: Classification autocomplete ── */}
                {step === "classification" && (
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                placeholder={t.searchClassification}
                                value={classQuery}
                                onChange={e => setClassQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-3 pr-1">
                            {/* Matching Materials Section */}
                            {matchingMaterials.length > 0 && (
                                <div className="space-y-1">
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-primary px-3 mb-1">
                                        {t.matchingMaterials}
                                    </h4>
                                    {matchingMaterials.map((item, idx) => (
                                        <button
                                            key={`${item.name}-${idx}`}
                                            type="button"
                                            onClick={() => handleSelectDirectMaterial(item)}
                                            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm hover:bg-primary/10 hover:text-primary transition-all text-left"
                                        >
                                            <div className="flex flex-col">
                                                <span className="font-semibold">{item.name}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-bold mt-0.5">{item.classification}</span>
                                            </div>
                                            <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded">
                                                {item.unit}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {/* Category Suggestions Section */}
                            <div className="space-y-1">
                                {classQuery.trim() !== "" && suggestions.length > 0 && (
                                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground px-3 mb-1 mt-2">
                                        {t.categories}
                                    </h4>
                                )}
                                {suggestions.length === 0 && matchingMaterials.length === 0 ? (
                                    <p className="text-sm text-muted-foreground text-center py-4">{t.noMatch}</p>
                                ) : (
                                    suggestions.map(name => (
                                        <button
                                            key={name}
                                            type="button"
                                            onClick={() => handleSelectClassification(name)}
                                            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium hover:bg-primary/10 hover:text-primary transition-colors text-left group"
                                        >
                                            <span className="flex items-center gap-2">
                                                <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                                                {name}
                                            </span>
                                            <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                                        </button>
                                    ))
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleAutre}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border border-dashed border-white/20 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all mt-2"
                        >
                            <Plus className="h-4 w-4" />
                            {t.autre}
                        </button>
                    </div>
                )}

                {/* ── STEP 2: Material picker ── */}
                {step === "material-pick" && (
                    <div className="space-y-2">
                        <div className="max-h-72 overflow-y-auto space-y-1 pr-1">
                            {classificationItems.map((item, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    onClick={() => handleSelectMaterial(item)}
                                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm hover:bg-primary/10 hover:text-primary transition-colors text-left group"
                                >
                                    <span className="font-medium">{item.name}</span>
                                    <span className="text-xs font-bold text-muted-foreground bg-white/5 px-2 py-0.5 rounded-md group-hover:bg-primary/20 group-hover:text-primary transition-colors flex-shrink-0 ml-2">
                                        {item.unit}
                                    </span>
                                </button>
                            ))}
                        </div>
                        {/* Autre button */}
                        <button
                            type="button"
                            onClick={handleAutre}
                            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold border border-dashed border-white/20 hover:border-primary/40 hover:bg-primary/5 hover:text-primary transition-all"
                        >
                            <Plus className="h-4 w-4" />
                            {t.autre}
                        </button>
                    </div>
                )}

                {/* ── STEP 3: Form ── */}
                {step === "form" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name — editable only if Autre */}
                        <div className="space-y-2">
                            <Label htmlFor="name">{t.materialName}</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder={t.materialName}
                                value={formData.name}
                                onChange={handleChange}
                                readOnly={!isAutre}
                                className={!isAutre ? "opacity-70 cursor-default" : ""}
                                required
                            />
                        </div>

                        {/* Category / Family */}
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="category">{t.classification}</Label>
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
                                    <Button type="button" size="sm" onClick={handleCreateNewCategory}>
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
                                    onValueChange={(val) => {
                                        if (val === "__new__") {
                                            setIsCreatingCategory(true)
                                        } else {
                                            setFormData({ ...formData, category: val })
                                        }
                                    }}
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
                            {/* Unit */}
                            <div className="space-y-2">
                                <Label htmlFor="unit">{t.unit}</Label>
                                {isAutre ? (
                                    <select
                                        id="unit"
                                        name="unit"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        <option value="">{t.selectUnit}</option>
                                        {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                    </select>
                                ) : (
                                    <Input
                                        id="unit"
                                        name="unit"
                                        value={formData.unit}
                                        readOnly
                                        className="opacity-70 cursor-default"
                                    />
                                )}
                            </div>
                            {/* Price */}
                            <div className="space-y-2">
                                <Label htmlFor="price">{t.unitPrice}</Label>
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
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="stockQuantity">{t.initialStock}</Label>
                                <Input
                                    id="stockQuantity"
                                    name="stockQuantity"
                                    type="number"
                                    placeholder="0"
                                    value={formData.stockQuantity}
                                    onChange={handleChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supplier">{t.supplier}</Label>
                                <Input
                                    id="supplier"
                                    name="supplier"
                                    placeholder={t.supplierOptional}
                                    value={formData.supplier}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose}>
                                {t.cancel}
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {t.addMaterial}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
