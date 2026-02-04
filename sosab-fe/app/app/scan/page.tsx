"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Package, CheckCircle, Plus, X, Loader2 } from "lucide-react"
import api from "@/lib/api"
import { toast } from "sonner"
import { useRouter, useSearchParams } from "next/navigation"

export default function ScanPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")

  const [materialName, setMaterialName] = useState("")
  const [materialUnit, setMaterialUnit] = useState("pcs")
  const [quantity, setQuantity] = useState("")
  const [deliveredBy, setDeliveredBy] = useState("")
  const [supplierName, setSupplierName] = useState("")
  const [notes, setNotes] = useState("")

  const [photos, setPhotos] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initial effect for search params
  useEffect(() => {
    const pId = searchParams.get('projectId')
    if (pId) setSelectedProjectId(pId)
  }, [searchParams])

  // Fetch Projects to get site name and handle fallback
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

  const handleSubmit = async () => {
    if (!selectedProjectId) return toast.error("Project context missing")
    if (!materialName) return toast.error("Please enter material name")
    if (!quantity) return toast.error("Please enter quantity")

    try {
      setSubmitting(true)
      const formData = new FormData()
      formData.append('projectId', selectedProjectId)
      formData.append('materialName', materialName)
      formData.append('unit', materialUnit)
      formData.append('quantity', quantity)
      formData.append('deliveredBy', deliveredBy)
      formData.append('supplier', supplierName)
      formData.append('notes', notes)

      photos.forEach(photo => formData.append('photos', photo))

      // Direct reception endpoint (Arrival only)
      const res = await api.post('/materials/direct-reception', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (res.data.success) {
        setSubmitted(true)
        setTimeout(() => router.push('/app/materials'), 2000)
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
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-success/20">
            <CheckCircle className="h-10 w-10 text-success" />
          </div>
          <h2 className="font-display text-2xl font-bold">Arrival Recorded!</h2>
          <p className="text-muted-foreground font-medium">Information has been saved to the project.</p>
        </div>
      </div>
    )
  }

  const currentProject = projects.find(p => p._id === selectedProjectId)

  return (
    <div className="space-y-6 p-4 pb-24 max-w-md mx-auto">
      <div className="pt-2">
        <h1 className="font-display text-2xl font-bold">Material Arrival</h1>
        <p className="text-sm text-muted-foreground font-medium">
          {currentProject ? `Site: ${currentProject.name}` : "Log material delivery"}
        </p>
      </div>

      <div className="space-y-4">
        <Card className="border-border bg-card shadow-sm overflow-hidden">
          <CardContent className="p-4 space-y-5">
            {/* Material Manual Entry */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <Package className="w-3 h-3" /> Material & Unit
              </Label>
              <div className="grid grid-cols-4 gap-2">
                <Input
                  className="col-span-3 bg-background h-11 border-border/50 transition-all focus:border-success/50"
                  placeholder="Material Name (e.g. Cement)"
                  value={materialName}
                  onChange={e => setMaterialName(e.target.value)}
                />
                <Select value={materialUnit} onValueChange={setMaterialUnit}>
                  <SelectTrigger className="bg-background h-11 border-border/50 px-2 font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['pcs', 'kg', 'ton', 'm3', 'm2', 'voy', 'sac'].map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quantity */}
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground flex items-center gap-1.5">
                <Plus className="w-3 h-3" /> Quantity Received
              </Label>
              <Input
                type="number"
                placeholder="0.00"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="bg-background h-14 text-2xl font-display font-bold text-center border-border/50 focus:ring-success/20"
              />
            </div>
          </CardContent>
        </Card>

        {/* Logistic Details */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Chauffeur (Livreur)</Label>
              <Input
                className="bg-background h-11 border-border/50 text-sm"
                placeholder="Driver Name"
                value={deliveredBy}
                onChange={(e) => setDeliveredBy(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Fournisseur (Supplier)</Label>
              <Input
                className="bg-background h-11 border-border/50 text-sm"
                placeholder="Supplier Name"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Notes & Evidence */}
        <Card className="border-border bg-card shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Notes</Label>
              <Input
                className="bg-background h-11 border-border/50 text-sm"
                placeholder="Additional details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase font-bold text-muted-foreground flex justify-between">
                Photos Evidence
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
                    className="aspect-square border-2 border-dashed border-border/50 rounded-xl flex flex-col items-center justify-center text-muted-foreground hover:bg-muted/30 transition-all hover:border-success/50"
                  >
                    <Camera className="w-6 h-6 mb-1 opacity-40" />
                    <span className="text-[8px] font-bold">ADD PHOTO</span>
                  </button>
                )}
              </div>
              <input type="file" accept="image/*" multiple className="hidden" ref={fileInputRef} onChange={handlePhotoChange} />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <Button
          className="w-full h-14 text-lg font-bold transition-all active:scale-[0.98] shadow-lg shadow-black/10 bg-success hover:bg-success/90 text-success-foreground"
          disabled={submitting}
          onClick={handleSubmit}
        >
          {submitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
          CONFIRM ARRIVAL
        </Button>
      </div>
    </div>
  )
}
