"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface User {
    _id: string
    name: string
    role: string
}

interface EditProjectManagersDialogProps {
    project: any
    open: boolean
    onOpenChange: (open: boolean) => void
    onManagersUpdated: () => void
}

export function EditProjectManagersDialog({ project, open, onOpenChange, onManagersUpdated }: EditProjectManagersDialogProps) {
    const { t, language } = useLanguage()
    const isRTL = language === "ar"
    const [isLoading, setIsLoading] = useState(false)
    const [loadingUsers, setLoadingUsers] = useState(false)
    const [users, setUsers] = useState<User[]>([])
    const [selectedManagers, setSelectedManagers] = useState<string[]>([])

    useEffect(() => {
        if (open) {
            fetchUsers()
            if (project?.managers) {
                setSelectedManagers(project.managers.map((m: any) => m._id || m))
            }
        }
    }, [open, project])

    const fetchUsers = async () => {
        try {
            setLoadingUsers(true)
            const res = await api.get("/users")
            if (res.data.success) {
                setUsers(res.data.data)
            }
        } catch (error) {
            toast.error("Failed to load users")
        } finally {
            setLoadingUsers(false)
        }
    }

    const handleManagerToggle = (userId: string) => {
        setSelectedManagers(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!project) return

        setIsLoading(true)

        try {
            const res = await api.patch(`/projects/${project._id}`, {
                managers: selectedManagers
            })

            if (res.data.success) {
                toast.success("Project managers updated successfully")
                onManagersUpdated()
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update project managers")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className={isRTL ? "text-right" : ""}>Manage Project Team</DialogTitle>
                    <DialogDescription className={isRTL ? "text-right" : ""}>
                        Assign managers and accountants to this project.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label className={cn("block", isRTL && "text-right")}>Select Team Members</Label>
                        <div className="border rounded-md p-2 max-h-60 overflow-y-auto space-y-1 bg-background" dir={isRTL ? "rtl" : "ltr"}>
                            {loadingUsers ? (
                                <div className="p-2 text-center text-sm text-muted-foreground">Loading...</div>
                            ) : users.length === 0 ? (
                                <div className="p-2 text-center text-sm text-muted-foreground">No users found</div>
                            ) : (
                                users.filter(u => ['Project Manager', 'Accountant', 'Gérant'].includes(u.role)).map((user) => (
                                    <label key={user._id} className={cn("flex items-center gap-2 cursor-pointer hover:bg-muted/40 rounded p-1", isRTL && "flex-row-reverse")}>
                                        <input
                                            type="checkbox"
                                            checked={selectedManagers.includes(user._id)}
                                            onChange={() => handleManagerToggle(user._id)}
                                            className="accent-primary"
                                        />
                                        <div className={isRTL ? "text-right" : "text-left"}>
                                            <span className="text-sm font-medium block">{user.name}</span>
                                            <span className="text-xs text-muted-foreground">{user.role}</span>
                                        </div>
                                    </label>
                                ))
                            )}
                        </div>
                        {selectedManagers.length > 0 && (
                            <p className={cn("text-xs text-muted-foreground", isRTL && "text-right")}>{selectedManagers.length} member(s) selected</p>
                        )}
                    </div>
                    <DialogFooter className={cn("gap-2", isRTL && "flex-row-reverse")}>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            {t("common.cancel") || "Cancel"}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />}
                            {t("common.save") || "Save Changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
