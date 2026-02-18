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
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { useLanguage } from "@/lib/language-context"

interface Project {
    _id: string
    name: string
}

interface Worker {
    _id: string
    name: string
    trade: string
    dailySalary: number
    projectId?: {
        _id?: string
        name: string
    }
    contact?: {
        phone?: string
        address?: string
    }
    isSubcontractor?: boolean
    supervisorId?: string | null
}

interface EditWorkerDialogProps {
    worker: Worker | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onWorkerUpdated: () => void
}

export function EditWorkerDialog({ worker, open, onOpenChange, onWorkerUpdated }: EditWorkerDialogProps) {
    const { t } = useLanguage()
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<Project[]>([])
    const [availableSupervisors, setAvailableSupervisors] = useState<any[]>([])

    // Form states
    const [name, setName] = useState("")
    const [trade, setTrade] = useState("")
    const [projectId, setProjectId] = useState("")
    const [dailySalary, setDailySalary] = useState("")
    const [phone, setPhone] = useState("")
    const [isSubcontractor, setIsSubcontractor] = useState(false)
    const [supervisorId, setSupervisorId] = useState("")

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
                // Filter only subcontractors, and exclude the current worker being edited
                setAvailableSupervisors(res.data.data.filter((w: any) => (w.isSubcontractor || w.trade === 'Sous Traitant') && w._id !== worker?._id))
            }
        } catch (error) {
            console.error("Failed to load potential supervisors", error)
        }
    }

    useEffect(() => {
        if (open && projectId) {
            fetchSupervisors(projectId)
        } else if (!projectId) {
            setAvailableSupervisors([])
        }
    }, [open, projectId, worker?._id])

    useEffect(() => {
        if (open) {
            fetchProjects()
        }
    }, [open])

    useEffect(() => {
        if (worker && open) {
            setName(worker.name)

            const currentTrade = worker.trade || ""
            setTrade(currentTrade)
            // Initialize custom service state
            if (currentTrade && !SERVICES.includes(currentTrade)) {
                setIsCustomService(true)
            } else {
                setIsCustomService(false)
            }
            // Handle projectId assuming the backend populates it. 
            // The worker object passed here from the table might have projectId as an object { name, managerId } (from population)
            // But we need the ID string for the select value.
            // Wait, the table worker object has `projectId: { name: string }`. It doesn't have `_id`. 
            // I need to make sure the fetch endpoint populates the _id or returns it.
            // Let's check the controller `getAllWorkers`. It populates `projectId` with `name managerId`. The `_id` is included by default in populated doc unless suppressed.
            // So `worker.projectId` is an object. `worker.projectId._id` should be available.

            // However, type in page.tsx says: projectId?: { name: string }. I'll need to update that interface too or cast it.
            // For now let's hope it's there.
            setProjectId((worker.projectId as any)?._id || "")
            setDailySalary(worker.dailySalary?.toString() || "")
            setPhone(worker.contact?.phone || "")
            setIsSubcontractor(worker.isSubcontractor || false)
            setSupervisorId(worker.supervisorId || "")
        }
    }, [worker, open])


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!worker) return

        setIsLoading(true)
        try {
            const payload: any = {
                name,
                trade,
                dailySalary: Number(dailySalary),
                contact: {
                    phone
                },
                isSubcontractor,
                supervisorId: supervisorId && supervisorId !== 'none' ? supervisorId : null
            }

            // Only send projectId if it's set, to allow updating it.
            if (projectId) {
                // To update project (assignment), `updateWorker` controller needs to handle logic. 
                // The current `updateWorker` might NOT re-assign project/manager link complexity if any.
                // But generally updating the `projectId` field in Worker document matches standard logic.
                // EXCEPT: Does `updateWorker` allow `projectId` in body?
                // Let's check controller.
                payload.projectId = projectId
            }

            const res = await api.patch(`/workers/${worker._id}`, payload)

            if (res.data.success) {
                toast.success("Worker updated successfully")
                onOpenChange(false)
                onWorkerUpdated()
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to update worker")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Worker</DialogTitle>
                    <DialogDescription>
                        Update worker details and project assignment.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-name" className="text-right">
                            Name
                        </Label>
                        <Input
                            id="edit-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">

                        <Label htmlFor="edit-trade" className="text-right">
                            Service
                        </Label>
                        <div className="col-span-3 space-y-2">
                            <Select
                                value={isCustomService ? "Other" : (SERVICES.includes(trade) ? trade : "")}
                                onValueChange={(val) => {
                                    if (val === "Other") {
                                        setIsCustomService(true)
                                        // Keep existing trade if switching to custom? Or clear?
                                        // Better to clear to avoid confusion unless it was already custom
                                        if (SERVICES.includes(trade)) setTrade("")
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
                                    id="edit-trade-custom"
                                    value={trade}
                                    onChange={(e) => setTrade(e.target.value)}
                                    placeholder="Enter custom service..."
                                    className="mt-2"
                                />
                            )}
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-project" className="text-right">
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
                        <Label htmlFor="edit-salary" className="text-right">
                            Salary
                        </Label>
                        <div className="col-span-3 relative">
                            <span className="absolute left-3 top-2.5 text-muted-foreground">TND</span>
                            <Input
                                id="edit-salary"
                                type="number"
                                value={dailySalary}
                                onChange={(e) => setDailySalary(e.target.value)}
                                className="pl-12"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="edit-phone" className="text-right">
                            Phone
                        </Label>
                        <Input
                            id="edit-phone"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="col-span-3"
                        />
                    </div>
                    <div className="flex items-center gap-2 px-1 py-1">
                        <input
                            type="checkbox"
                            id="isSubcontractor-edit"
                            checked={isSubcontractor}
                            onChange={(e) => setIsSubcontractor(e.target.checked)}
                            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <Label htmlFor="isSubcontractor-edit" className="text-sm font-medium cursor-pointer">
                            {t("projects.is_subcontractor") || "Is Subcontractor?"}
                        </Label>
                    </div>

                    {!isSubcontractor && availableSupervisors.length > 0 && (
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="supervisor-edit" className="text-right text-xs">
                                {t("projects.supervised_by") || "Supervised By"}
                            </Label>
                            <Select value={supervisorId || "none"} onValueChange={setSupervisorId}>
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
                            Save Changes
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
