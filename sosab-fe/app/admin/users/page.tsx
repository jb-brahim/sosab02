"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2, MoreHorizontal, User as UserIcon } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CreateUserDialog } from "@/components/admin/create-user-dialog"
import { EditUserDialog } from "@/components/admin/edit-user-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useLanguage } from "@/lib/language-context"
import { cn } from "@/lib/utils"

interface User {
    _id: string
    name: string
    email: string
    role: string
    active: boolean
    assignedProjects: { _id: string; name: string }[]
}

export default function UsersPage() {
    const { t, language } = useLanguage()
    const isRTL = language === "ar"
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

    const fetchUsers = async () => {
        try {
            const res = await api.get("/users")
            if (res.data.success) {
                setUsers(res.data.data)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch users")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchUsers()
    }, [])

    const handleDelete = async () => {
        if (!selectedUser) return
        try {
            const res = await api.delete(`/users/${selectedUser._id}`)
            if (res.data.success) {
                toast.success(t("users.delete_success") || "User deleted successfully")
                fetchUsers()
                setDeleteDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete user")
        }
    }

    return (
        <div className="space-y-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={isRTL ? "text-right" : "text-left"}>
                    <h1 className="font-display text-3xl font-bold tracking-tight">{t("nav.users") || "Users"}</h1>
                    <p className="text-muted-foreground mt-1">{t("users.description") || "Manage system access and roles."}</p>
                </div>
                <CreateUserDialog onUserCreated={fetchUsers} />
            </div>

            <Card className={isRTL ? "text-right" : "text-left"}>
                <CardHeader className={cn(isRTL && "flex-row-reverse")}>
                    <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <UserIcon className="h-5 w-5 text-primary" />
                        {t("users.all_users") || "All Users"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table className={isRTL ? "text-right" : "text-left"}>
                                <TableHeader>
                                    <TableRow className={cn(isRTL && "flex-row-reverse")}>
                                        <TableHead className={isRTL ? "text-right" : ""}>{t("users.name") || "Name"}</TableHead>
                                        <TableHead className={isRTL ? "text-right" : ""}>{t("users.email") || "Email"}</TableHead>
                                        <TableHead className={isRTL ? "text-right" : ""}>{t("users.role") || "Role"}</TableHead>
                                        <TableHead className={isRTL ? "text-right" : ""}>{t("nav.projects") || "Projects"}</TableHead>
                                        <TableHead className={isRTL ? "text-right" : ""}>{t("users.status") || "Status"}</TableHead>
                                        <TableHead className={isRTL ? "text-left" : "text-right"}>{t("common.actions") || "Actions"}</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {users.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                                {t("users.no_users") || "No users found."}
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        users.map((user) => (
                                            <TableRow key={user._id} className={cn(isRTL && "flex-row-reverse")}>
                                                <TableCell className="font-medium">{user.name}</TableCell>
                                                <TableCell>{user.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant="outline" className="capitalize">
                                                        {user.role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {user.assignedProjects?.length > 0 ? (
                                                        <div className={cn("flex flex-wrap gap-1", isRTL && "justify-end")}>
                                                            {user.assignedProjects.map(p => (
                                                                <Badge key={p._id} variant="secondary" className="text-xs">{p.name}</Badge>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground text-sm">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge variant={user.active ? "default" : "destructive"}>
                                                        {user.active ? (t("users.active") || "Active") : (t("users.inactive") || "Inactive")}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className={isRTL ? "text-left" : "text-right"}>
                                                    {user.role === 'Admin' ? (
                                                        <span className="text-muted-foreground text-xs italic">{t("users.restricted") || "Restricted"}</span>
                                                    ) : (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align={isRTL ? "start" : "end"}>
                                                                <DropdownMenuItem
                                                                    className={cn(isRTL && "text-right justify-end")}
                                                                    onClick={() => {
                                                                        setSelectedUser(user)
                                                                        setEditDialogOpen(true)
                                                                    }}>
                                                                    {t("common.edit") || "Edit"}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className={cn("text-destructive", isRTL && "text-right justify-end")}
                                                                    onClick={() => {
                                                                        setSelectedUser(user)
                                                                        setDeleteDialogOpen(true)
                                                                    }}
                                                                >
                                                                    {t("common.delete") || "Delete"}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <EditUserDialog
                user={selectedUser}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onUserUpdated={fetchUsers}
            />

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={isRTL ? "text-right" : ""}>
                            {t("users.delete_confirm_title") || "Are you absolutely sure?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className={isRTL ? "text-right" : ""}>
                            {t("users.delete_confirm_desc") || "This action will permanently delete the user account for"}
                            <span className="font-bold block mt-2 text-primary"> {selectedUser?.name} </span>.
                            {t("users.delete_warning") || "They will no longer be able to log in and all their associations will be removed."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={isRTL ? "flex-row-reverse gap-2" : ""}>
                        <AlertDialogCancel>{t("common.cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("common.delete") || "Delete User"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

