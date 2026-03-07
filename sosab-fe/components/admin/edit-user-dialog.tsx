"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface User {
    _id: string
    name: string
    email: string
    role: string
}

interface EditUserDialogProps {
    user: User | null
    open: boolean
    onOpenChange: (open: boolean) => void
    onUserUpdated: () => void
}

export function EditUserDialog({ user, open, onOpenChange, onUserUpdated }: EditUserDialogProps) {
    const { t, language } = useLanguage()
    const isRTL = language === "ar"
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        role: "",
    })

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                email: user.email,
                role: user.role,
            })
        }
    }, [user])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRoleChange = (value: string) => {
        setFormData({ ...formData, role: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user) return

        setIsLoading(true)

        try {
            const res = await api.patch(`/users/${user._id}`, formData)

            if (res.data.success) {
                toast.success(t("users.update_success") || "User updated successfully")
                onUserUpdated()
                onOpenChange(false)
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update user")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className={isRTL ? "text-right" : ""}>{t("users.edit_user") || "Edit User Details"}</DialogTitle>
                    <DialogDescription className={isRTL ? "text-right" : ""}>
                        {t("users.edit_user_desc") || "Update information for"} <span className="font-semibold">{user?.name}</span>.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name" className={cn("block", isRTL && "text-right")}>{t("users.full_name") || "Full Name"}</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder={t("users.name_placeholder") || "e.g. John Doe"}
                            value={formData.name}
                            onChange={handleChange}
                            required
                            className={isRTL ? "text-right" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email" className={cn("block", isRTL && "text-right")}>{t("users.email") || "Email Address"}</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            placeholder="name@example.com"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            className={isRTL ? "text-right" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role" className={cn("block", isRTL && "text-right")}>{t("users.role") || "Role"}</Label>
                        <Select onValueChange={handleRoleChange} value={formData.role} dir={isRTL ? "rtl" : "ltr"}>
                            <SelectTrigger className={isRTL ? "flex-row-reverse" : ""}>
                                <SelectValue placeholder={t("users.select_role") || "Select role"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Admin">{t("users.roles.admin") || "Admin"}</SelectItem>
                                <SelectItem value="Project Manager">{t("users.roles.pm") || "Project Manager"}</SelectItem>
                                <SelectItem value="Gérant">{t("users.roles.gerant") || "Gérant"}</SelectItem>
                                <SelectItem value="Worker">{t("users.roles.worker") || "Worker"}</SelectItem>
                            </SelectContent>
                        </Select>
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

