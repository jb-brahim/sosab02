"use client"

import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Loader2, ChevronRight, Search, ArrowLeft, LayoutGrid } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { MATERIAL_CATALOG, ALL_CLASSIFICATION_NAMES, type MaterialEntry } from "@/lib/material-catalog"

interface CreateMaterialDialogProps {
    projectId: string
    onMaterialCreated: () => void
    disabled?: boolean
}

type Step = "classification" | "material-pick" | "form"

const UNITS = ['kg', 'T', 'm', 'ml', 'm²', 'm³', 'U', 'L', 'box', 'bag', 'liter']

export function CreateMaterialDialog({ projectId, onMaterialCreated, disabled }: CreateMaterialDialogProps) {
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [step, setStep] = useState<Step>("classification")

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

    // Filter classification suggestions
    const suggestions = classQuery.trim() === ""
        ? ALL_CLASSIFICATION_NAMES
        : ALL_CLASSIFICATION_NAMES.filter(c =>
            c.toLowerCase().includes(classQuery.toLowerCase())
        )

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

    const handleAutre = () => {
        setIsAutre(true)
        setFormData(prev => ({
            ...prev,
            name: "",
            unit: "",
            category: selectedClassification,
        }))
        setStep("form")
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
                toast.success("Material added successfully")
                handleClose()
                onMaterialCreated()
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to add material")
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setOpen(false)
        // Reset on next tick to avoid flicker
        setTimeout(() => {
            setStep("classification")
            setClassQuery("")
            setSelectedClassification("")
            setIsAutre(false)
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
                <Button disabled={disabled}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Material
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
                        {step === "classification" && "Add Material"}
                        {step === "material-pick" && selectedClassification}
                        {step === "form" && (isAutre ? "New Material" : formData.name || "Material Details")}
                    </DialogTitle>
                    <DialogDescription>
                        {step === "classification" && "Type or choose a classification"}
                        {step === "material-pick" && "Choose a material or add a custom one"}
                        {step === "form" && "Fill in the remaining details"}
                    </DialogDescription>
                </DialogHeader>

                {/* ── STEP 1: Classification autocomplete ── */}
                {step === "classification" && (
                    <div className="space-y-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                ref={inputRef}
                                placeholder="Search classification…"
                                value={classQuery}
                                onChange={e => setClassQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                        <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
                            {suggestions.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">No match found</p>
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
                            Autre (custom material)
                        </button>
                    </div>
                )}

                {/* ── STEP 3: Form ── */}
                {step === "form" && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name — editable only if Autre */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Material Name</Label>
                            <Input
                                id="name"
                                name="name"
                                placeholder="Material name"
                                value={formData.name}
                                onChange={handleChange}
                                readOnly={!isAutre}
                                className={!isAutre ? "opacity-70 cursor-default" : ""}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Category — always locked to chosen classification */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Classification</Label>
                                <Input
                                    id="category"
                                    name="category"
                                    value={formData.category}
                                    readOnly
                                    className="opacity-70 cursor-default"
                                />
                            </div>
                            {/* Unit — editable only if Autre */}
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                {isAutre ? (
                                    <select
                                        id="unit"
                                        name="unit"
                                        value={formData.unit}
                                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                    >
                                        <option value="">Select unit</option>
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
                            <Button type="button" variant="outline" onClick={handleClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Add Material
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}
