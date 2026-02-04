"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Phone, MapPin, Briefcase, Banknote, Calendar, Building2, User } from "lucide-react"

interface WorkerDetailsDialogProps {
    worker: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function WorkerDetailsDialog({ worker, open, onOpenChange }: WorkerDetailsDialogProps) {
    if (!worker) return null

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px]">
                <DialogHeader>
                    <DialogTitle className="text-xl">Worker Profile</DialogTitle>
                    <DialogDescription>
                        Detailed information about the worker.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Header Info */}
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="text-2xl font-bold">{worker.name}</h3>
                            <div className="flex items-center gap-2 mt-1 text-muted-foreground">
                                <Briefcase className="h-4 w-4" />
                                <span>{worker.trade} (Service)</span>
                            </div>
                        </div>
                        <Badge variant={worker.status === "active" ? "default" : "secondary"} className="text-sm px-3 py-1">
                            {worker.status}
                        </Badge>
                    </div>

                    <Separator />

                    <div className="grid grid-cols-2 gap-6">
                        {/* Assignment Details */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Assignment</h4>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Building2 className="h-4 w-4 mt-1 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Project</p>
                                        <p className="text-sm text-muted-foreground">{worker.projectId?.name || "Unassigned"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <User className="h-4 w-4 mt-1 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Manager</p>
                                        <p className="text-sm text-muted-foreground">{worker.projectId?.managerId?.name || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <Banknote className="h-4 w-4 mt-1 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Daily Salary</p>
                                        <p className="text-sm text-muted-foreground font-mono">{worker.dailySalary} TND</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Details */}
                        <div className="space-y-4">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Contact Info</h4>

                            <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                    <Phone className="h-4 w-4 mt-1 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Phone</p>
                                        <p className="text-sm text-muted-foreground">{worker.contact?.phone || "N/A"}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <MapPin className="h-4 w-4 mt-1 text-primary" />
                                    <div>
                                        <p className="text-sm font-medium">Address</p>
                                        <p className="text-sm text-muted-foreground">{worker.contact?.address || "N/A"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Skills */}
                    {worker.skills && worker.skills.length > 0 && (
                        <div className="space-y-3">
                            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Skills</h4>
                            <div className="flex flex-wrap gap-2">
                                {worker.skills.map((skill: string, i: number) => (
                                    <Badge key={i} variant="outline">{skill}</Badge>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
