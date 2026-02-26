"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Package, CheckCircle, Plus, X, Loader2, Calendar as CalendarIcon, Search, ChevronRight, ArrowLeft } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import api from "@/lib/api"
import { toast } from "sonner"
import { format } from "date-fns"
import { useRouter, useSearchParams } from "next/navigation"
import { useLanguage } from "@/lib/language-context"
import { MATERIAL_CATALOG, ALL_CLASSIFICATION_NAMES } from "@/lib/material-catalog"

export default function ScanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { t } = useLanguage()

  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  const [materialName, setMaterialName] = useState("")
  const [materialUnit, setMaterialUnit] = useState("pcs")
  const [quantity, setQuantity] = useState("")
  const [deliveredBy, setDeliveredBy] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [bonLivraison, setBonLivraison] = useState("")
  const [notes, setNotes] = useState("")

  // Selection state
  const [classQuery, setClassQuery] = useState("")
  const [selectedClassification, setSelectedClassification] = useState("")
  const [isCustomMaterial, setIsCustomMaterial] = useState(false)
  const [showClassSuggestions, setShowClassSuggestions] = useState(false)

  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Suggestions logic
  const classSuggestions = ALL_CLASSIFICATION_NAMES.filter(name =>
    name.toLowerCase().includes(classQuery.toLowerCase())
  )

  const catalogItems = MATERIAL_CATALOG.find(c => c.classification === selectedClassification)?.items || []

  // Effects
  useEffect(() => {
    const pId = searchParams.get('projectId')
    if (pId) setSelectedProjectId(pId)
  }, [searchParams])

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects')
        if (res.data.success) {
          setProjects(res.data.data)
          if (res.data.data.length > 0 && !selectedProjectId) {
            setSelectedProjectId(res.data.data[0]._id)
          }
        }
      } catch (error) {
        toast.error("Failed to load project details")
      }
    }
    fetchProjects()
  }, [selectedProjectId])

  // Handlers
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setPhotos(prev => [...prev, ...newFiles])
      const newPreviews = newFiles.map(file => URL.createObjectURL(file))
      setPreviews(prev => [...prev, ...newPreviews])
    }
  }

  const removePhoto = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => {
      URL.revokeObjectURL(prev[index])
      return prev.filter((_, i) => i !== index)
    })
  }

  const handleSelectMaterial = (name: string, unit: string) => {
    setMaterialName(name)
    setMaterialUnit(unit)
    setIsCustomMaterial(false)
  }

  const handleCustomMaterial = () => {
    setMaterialName("")
    setMaterialUnit("pcs")
    setIsCustomMaterial(true)
    setSelectedClassification("")
  }

  const resetSelection = () => {
    setSelectedClassification("")
    setMaterialName("")
    setIsCustomMaterial(false)
    setClassQuery("")
  }

  const handleSubmit = async () => {
    if (!selectedProjectId) return toast.error(t("materials.project_missing"))
    if (!materialName) return toast.error(t("materials.enter_material_name"))
    if (!quantity) return toast.error(t("materials.enter_quantity"))

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('projectId', selectedProjectId)
      formData.append('materialName', materialName)
      formData.append('unit', materialUnit)
      formData.append('quantity', quantity)
      formData.append('deliveredBy', deliveredBy)
      formData.append('supplier', supplierName)
      formData.append('bonLivraison', bonLivraison)
      formData.append('arrivalDate', format(selectedDate, 'yyyy-MM-dd'))
      formData.append('notes', notes)
      formData.append('category', selectedClassification || "Autre")

      photos.forEach(photo => formData.append('photos', photo))

      const res = await api.post('/materials/direct-reception', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success) {
        setSubmitted(true)
        setTimeout(() => router.push('/app/stock'), 2000)
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to log arrival")
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="flex min-h-[80vh] flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-green-500/20">
            <CheckCircle className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="font-display text-2xl font-bold">{t("materials.arrival_success")}</h2>
          <p className="text-muted-foreground font-medium">{t("materials.arrival_saved")}</p>
        </div>
      </div>
    )
  }

  const currentProject = projects.find(p => p._id === selectedProjectId)

  return (
    <div className="space-y-6 p-4 pb-24 max-w-md mx-auto">
      <div className="pt-2 flex items-start justify-between gap-3">
        <div className="flex-1">
          <h1 className="font-display text-2xl font-bold">{t("materials.arrival_title")}</h1>
          <p className="text-sm text-muted-foreground font-medium">
            {currentProject ? `${t("materials.site_label")}: ${currentProject.name}` : t("materials.log_delivery")}
          </p>
        </div>
        <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="bg-background/50 text-xs font-black uppercase tracking-widest px-3 py-2 h-auto border-border/40 hover:bg-background/80 hover:border-primary/30 transition-all flex-shrink-0"
            >
              <CalendarIcon className="w-3.5 h-3.5 mr-2" />
              {format(selectedDate, 'MMM dd')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date)
                  setDatePickerOpen(false)
                }
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="space-y-4">
        <Card className="border-border bg-card shadow-sm overflow-hidden min-h-[160px]">
          <CardContent className="p-4 space-y-5">
            {!selectedClassification && !isCustomMaterial ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5 px-1">
                    <Search className="w-3 h-3" /> {t("materials.search_label") || "Trouver un matériel"}
                  </Label>
                  <div className="relative">
                    <Input
                      className="bg-background h-12 border-border/50 rounded-2xl focus:ring-green-500/20 shadow-sm"
                      placeholder={t("materials.search_placeholder_arrival") || "Ex: Ciment, Sable, Acier..."}
                      value={classQuery}
                      onChange={e => {
                        setClassQuery(e.target.value)
                        setShowClassSuggestions(true)
                      }}
                      onFocus={() => setShowClassSuggestions(true)}
                    />
                    {showClassSuggestions && classQuery.length > 0 && (
                      <div className="absolute top-full left-0 right-0 z-50 mt-2 bg-card border border-border/50 rounded-2xl shadow-2xl max-h-[300px] overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in-95 duration-200">
                        {/* Material Suggestions */}
                        {MATERIAL_CATALOG.flatMap(cat =>
                          cat.items.map(item => ({ ...item, classification: cat.classification }))
                        ).filter(item =>
                          item.name.toLowerCase().includes(classQuery.toLowerCase())
                        ).slice(0, 20).map((item, idx) => (
                          <button
                            key={`${item.name}-${idx}`}
                            className="w-full text-left px-4 py-3 text-sm hover:bg-green-500/5 transition-colors flex flex-col border-b border-border/5 last:border-0"
                            onClick={() => {
                              setSelectedClassification(item.classification)
                              setMaterialName(item.name)
                              setMaterialUnit(item.unit)
                              setShowClassSuggestions(false)
                            }}
                          >
                            <span className="font-semibold">{item.name}</span>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">{item.classification}</span>
                              <span className="text-[10px] text-green-500/70 font-black uppercase text-[8px]">• {item.unit}</span>
                            </div>
                          </button>
                        ))}
                        {/* Classification Suggestions */}
                        {classSuggestions.map(name => (
                          <button
                            key={`cat-${name}`}
                            className="w-full text-left px-4 py-3 text-sm bg-muted/20 hover:bg-green-500/5 transition-colors flex justify-between items-center border-b border-border/5 last:border-0"
                            onClick={() => {
                              setSelectedClassification(name)
                              setShowClassSuggestions(false)
                            }}
                          >
                            <div className="flex flex-col">
                              <span className="font-bold text-xs uppercase tracking-tight">{name}</span>
                              <span className="text-[9px] text-muted-foreground italic">Parcourir la catégorie</span>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                          </button>
                        ))}
                        <button
                          className="w-full text-left px-4 py-3 text-sm text-green-500 font-bold hover:bg-green-500/5 transition-colors border-t border-green-500/10"
                          onClick={handleCustomMaterial}
                        >
                          + {t("materials.other_manual") || "Saisir manuellement"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Classification Chips Area */}
                <div className="space-y-2 pt-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground px-1">
                    {t("materials.browse_categories") || "Parcourir par catégories"}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {ALL_CLASSIFICATION_NAMES.map(name => (
                      <Button
                        key={name}
                        variant="outline"
                        size="sm"
                        className="rounded-full h-8 text-[10px] font-bold uppercase tracking-wider border-border/40 hover:border-green-500/30 hover:bg-green-500/5 transition-all"
                        onClick={() => setSelectedClassification(name)}
                      >
                        {name}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : selectedClassification && !materialName && !isCustomMaterial ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between px-1">
                  <div>
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t("materials.category") || "Catégorie"}</Label>
                    <p className="text-sm font-bold text-foreground">{selectedClassification}</p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-8 text-[10px] uppercase font-bold text-muted-foreground hover:text-green-500 rounded-xl" onClick={resetSelection}>
                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> {t("common.back") || "Retour"}
                  </Button>
                </div>
                <div className="grid grid-cols-1 gap-1.5 max-h-[350px] overflow-y-auto pr-1">
                  {catalogItems.map(item => (
                    <button
                      key={item.name}
                      onClick={() => handleSelectMaterial(item.name, item.unit)}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-border/10 hover:border-green-500/30 hover:bg-green-500/5 transition-all group active:scale-[0.98]"
                    >
                      <span className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">{item.name}</span>
                      <span className="text-[10px] font-black text-muted-foreground/60 group-hover:text-green-600 uppercase tracking-widest">{item.unit}</span>
                    </button>
                  ))}
                  <Button variant="outline" className="mt-2 border-dashed border-border/30 h-11 text-xs font-bold uppercase tracking-wider rounded-xl hover:bg-green-500/5" onClick={handleCustomMaterial}>
                    + {t("materials.other") || "Autre article"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5 animate-in fade-in slide-in-from-bottom-2">
                <div className="flex items-center justify-between p-3 rounded-xl bg-green-500/5 border border-green-500/20">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="h-9 w-9 rounded-lg bg-green-500/10 flex items-center justify-center flex-shrink-0">
                      <Package className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold leading-tight truncate">{materialName || "Nouveau Matériel"}</p>
                      <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider truncate">
                        {isCustomMaterial ? t("materials.custom") || "Manuel" : selectedClassification} • {materialUnit}
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-green-500/10 flex-shrink-0" onClick={resetSelection}>
                    <ArrowLeft className="w-4 h-4 text-green-500" />
                  </Button>
                </div>

                {isCustomMaterial && (
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t("materials.material_unit")}</Label>
                    <div className="grid grid-cols-4 gap-2">
                      <Input
                        className="col-span-3 bg-background h-11 border-border/50"
                        placeholder="Nom du matériel"
                        value={materialName}
                        onChange={e => setMaterialName(e.target.value)}
                      />
                      <Select value={materialUnit} onValueChange={setMaterialUnit}>
                        <SelectTrigger className="bg-background h-11 border-border/50 font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {['pcs', 'kg', 'T', 'm', 'ml', 'm²', 'm³', 'U', 'L', 'box', 'bag', 'liter'].map(u => (
                            <SelectItem key={u} value={u}>{u}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                    <Plus className="w-3 h-3 text-green-500" /> {t("materials.qty_received")}
                  </Label>
                  <Input
                    type="number"
                    placeholder="0.00"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="bg-background h-14 text-3xl font-display font-bold text-center border-border/50 focus:ring-green-500/20 rounded-2xl"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {(materialName || isCustomMaterial) && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4 grid grid-cols-1 gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t("materials.driver_label")}</Label>
                    <Input
                      className="bg-background h-11 border-border/50 text-sm"
                      placeholder={t("materials.driver_placeholder")}
                      value={deliveredBy}
                      onChange={(e) => setDeliveredBy(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t("materials.supplier_label")}</Label>
                    <Input
                      className="bg-background h-11 border-border/50 text-sm"
                      placeholder={t("materials.supplier_placeholder")}
                      value={supplierName}
                      onChange={(e) => setSupplierName(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">N° Bon de Livraison</Label>
                  <Input
                    className="bg-background h-11 border-border/50 text-sm"
                    placeholder="Ex: BL-2024-0123"
                    value={bonLivraison}
                    onChange={(e) => setBonLivraison(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground">{t("materials.notes_label")}</Label>
                  <Input
                    className="bg-background h-11 border-border/50 text-sm"
                    placeholder={t("materials.notes_placeholder")}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                    {t("materials.photo_evidence")}
                    <span>{photos.length}/10</span>
                  </Label>
                  <div className="grid grid-cols-4 gap-2">
                    {previews.map((src, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-border bg-muted/50 group">
                        <img src={src} alt="Preview" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removePhoto(i)}
                          className="absolute top-1 right-1 bg-destructive/90 text-white rounded-full p-1 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                    {photos.length < 10 && (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-square border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 transition-all hover:border-green-500/50"
                      >
                        <Camera className="w-6 h-6 mb-1 opacity-40" />
                        <span className="text-[8px] font-bold">{t("materials.add_photo")}</span>
                      </button>
                    )}
                  </div>
                  <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handlePhotoChange} />
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full h-14 text-lg font-bold transition-all active:scale-[0.98] shadow-lg shadow-black/10 bg-green-600 hover:bg-green-700 text-white rounded-2xl"
              disabled={submitting}
              onClick={handleSubmit}
            >
              {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
              {t("materials.confirm_arrival")}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
