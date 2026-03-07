"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Loader2 } from "lucide-react"
import { toast } from "sonner"
import api from "@/lib/api"

import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface CreateUserDialogProps {
    onUserCreated: () => void
}

export function CreateUserDialog({ onUserCreated }: CreateUserDialogProps) {
    const { t, language } = useLanguage()
    const isRTL = language === "ar"
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        role: "",
    })

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleRoleChange = (value: string) => {
        setFormData({ ...formData, role: value })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const res = await api.post("/users", formData)

            if (res.data.success) {
                toast.success(t("users.create_success") || "User created successfully")
                setOpen(false)
                onUserCreated()
                setFormData({
                    name: "",
                    email: "",
                    password: "",
                    role: "",
                })
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to create user")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                    {t("users.add_user") || "Add User"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className={isRTL ? "text-right" : ""}>{t("users.add_user") || "Add New User"}</DialogTitle>
                    <DialogDescription className={isRTL ? "text-right" : ""}>
                        {t("users.add_user_desc") || "Create a new user account with specific role and access."}
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
                        <Label htmlFor="password" className={cn("block", isRTL && "text-right")}>{t("users.password") || "Password"}</Label>
                        <Input
                            id="password"
                            name="password"
                            type="password"
                            placeholder="••••••••"
                            value={formData.password}
                            onChange={handleChange}
                            required
                            className={isRTL ? "text-right" : ""}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="role" className={cn("block", isRTL && "text-right")}>{t("users.role") || "Role"}</Label>
                        <Select onValueChange={handleRoleChange} required dir={isRTL ? "rtl" : "ltr"}>
                            <SelectTrigger className={isRTL ? "flex-row-reverse" : ""}>
                                <SelectValue placeholder={t("users.select_role") || "Select role"} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Project Manager">{t("users.roles.pm") || "Project Manager"}</SelectItem>
                                <SelectItem value="Gérant">{t("users.roles.gerant") || "Gérant"}</SelectItem>
                                <SelectItem value="Worker">{t("users.roles.worker") || "Worker"}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <DialogFooter className={cn("gap-2", isRTL && "flex-row-reverse")}>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            {t("common.cancel") || "Cancel"}
                        </Button>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Loader2 className={cn("h-4 w-4 animate-spin", isRTL ? "ml-2" : "mr-2")} />}
                            {t("users.create_user") || "Create User"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

