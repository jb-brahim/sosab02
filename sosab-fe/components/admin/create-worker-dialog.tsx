"use client"

import { useState, useEffect } from "react"
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

interface Project {
    _id: string
    name: string
}

interface CreateWorkerDialogProps {
    onWorkerCreated: () => void
}

export function CreateWorkerDialog({ onWorkerCreated }: CreateWorkerDialogProps) {
    const { t } = useLanguage()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<Project[]>([])

    // Form states
    const [name, setName] = useState("")
    const [trade, setTrade] = useState("")
    const [projectId, setProjectId] = useState("")
    const [dailySalary, setDailySalary] = useState("")
    const [phone, setPhone] = useState("")
    const [isSubcontractor, setIsSubcontractor] = useState(false)
    const [supervisorId, setSupervisorId] = useState("")
    const [availableSupervisors, setAvailableSupervisors] = useState<any[]>([])

    // UI state for custom service input
    const [isCustomService, setIsCustomService] = useState(false)
    const SERVICES = ["Masonry 🧱", "Carpentry 🪚", "Electrical Works ⚡", "Plumbing 🚰"]

    const fetchProjects = async () => {
        try {
            const res = await api.get("/projects")
            if (res.data.success) {
                setProjects(res.data.data)
            }
        } catch (error) {
            toast.error("Failed to load projects")
        }
    }

    const fetchSupervisors = async (pId: string) => {
        if (!pId) {
            setAvailableSupervisors([])
            return
        }
        try {
            const res = await api.get(`/workers/${pId}`)
            if (res.data.success) {
                // Filter only subcontractors
                setAvailableSupervisors(res.data.data.filter((w: any) => w.isSubcontractor || w.trade === 'Sous Traitant'))
            }
        } catch (error) {
            console.error("Failed to load potential supervisors", error)
        }
    }

    useEffect(() => {
        if (projectId) {
            fetchSupervisors(projectId)
        }
    }, [projectId])

    useEffect(() => {
        if (open) {
            fetchProjects()
        }
    }, [open])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name || !trade || !projectId || !dailySalary) {
            toast.error("Please fill in all required fields")
            return
        }

        setIsLoading(true)
        try {
            const res = await api.post("/workers", {
                name,
                trade,
                projectId,
                dailySalary: Number(dailySalary),
                contact: {
                    phone
                },
                isSubcontractor,
                supervisorId: supervisorId || null
            })

            if (res.data.success) {
                toast.success("Worker added successfully")
                setOpen(false)
                resetForm()
                onWorkerCreated()
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to add worker")
        } finally {
            setIsLoading(false)
        }
    }

    const resetForm = () => {
        setName("")
        setTrade("")
        setProjectId("")
        setDailySalary("")
        setPhone("")
        setIsSubcontractor(false)
        setSupervisorId("")
        setIsCustomService(false)
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Worker
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Worker</DialogTitle>
                    <DialogDescription>
                        Register a new worker and assign them to a project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            placeholder="John Doe"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="trade" className="text-right">
                            Service
                        </Label>
                        <div className="col-span-3 space-y-2">
                            <Select
                                value={isCustomService ? "Other" : (SERVICES.includes(trade) ? trade : "")}
                                onValueChange={(val) => {
                                    if (val === "Other") {
                                        setIsCustomService(true)
                                        setTrade("")
                                    } else {
                                        setIsCustomService(false)
                                        setTrade(val)
                                    }
                                }}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select service" />
                                </SelectTrigger>
                                <SelectContent>
                                    {SERVICES.map(s => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                    <SelectItem value="Other">Other (Write Custom)</SelectItem>
                                </SelectContent>
                            </Select>
                            {isCustomService && (
                                <Input
                                    id="trade-custom"
                                    value={trade}
                                    onChange={(e) => setTrade(e.target.value)}
                                    placeholder="Enter custom service..."
                                    className="mt-2"
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="project" className="text-right">
                            Project
                        </Label>
                        <Select value={projectId} onValueChange={setProjectId}>
                            <SelectTrigger className="col-span-3">
                                <SelectValue placeholder="Select project" />
                            </SelectTrigger>
                            <SelectContent>
                                {projects.map((project) => (
                                    <SelectItem key={project._id} value={project._id}>
                                        {project.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="salary" className="text-right">
                            Salary
                        </Label>
                        <div className="col-span-3 relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">TND</span>
                            <Input
                                id="salary"
                                type="number"
                                value={dailySalary}
                                onChange={(e) => setDailySalary(e.target.value)}
                                className="pl-12"
                                placeholder="0.00"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right">
                            Phone
                        </Label>
                        <Input
                            id="phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="col-span-3"
                            placeholder="+1 234..."
                        />
                    </div>
                    <div className="flex items-center gap-2 px-1 py-1">
                        <input
                            type="checkbox"
                            id="isSubcontractor"
                            checked={isSubcontractor}
                            onChange={(e) => setIsSubcontractor(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="isSubcontractor" className="text-sm font-medium cursor-pointer">
                            {t("projects.is_subcontractor") || "Is Subcontractor?"}
                        </Label>
                    </div>

                    {!isSubcontractor && availableSupervisors.length > 0 && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="supervisor" className="text-right text-xs">
                                {t("projects.supervised_by") || "Supervised By"}
                            </Label>
                            <Select value={supervisorId} onValueChange={setSupervisorId}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder={t("projects.direct_supervised") || "Direct / No Supervisor"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">{t("projects.direct_supervised") || "Direct / No Supervisor"}</SelectItem>
                                    {availableSupervisors.map((s) => (
                                        <SelectItem key={s._id} value={s._id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Add Worker
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog >
    )
}
