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

interface User {
    _id: string
    name: string
    email: string
    role: string
    active: boolean
    assignedProjects: { _id: string; name: string }[]
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [editDialogOpen, setEditDialogOpen] = useState(false)
    const [deactivateDialogOpen, setDeactivateDialogOpen] = useState(false)

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

    const handleDeactivate = async () => {
        if (!selectedUser) return
        try {
            const res = await api.delete(`/users/${selectedUser._id}`)
            if (res.data.success) {
                toast.success("User deactivated successfully")
                fetchUsers()
                setDeactivateDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to deactivate user")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Users</h1>
                    <p className="text-muted-foreground mt-1">Manage system access and roles.</p>
                </div>
                <CreateUserDialog onUserCreated={fetchUsers} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <UserIcon className="h-5 w-5 text-primary" />
                        All Users
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Projects</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No users found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    users.map((user) => (
                                        <TableRow key={user._id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {user.assignedProjects?.length > 0 ? (
                                                    <div className="flex flex-wrap gap-1">
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
                                                    {user.active ? "Active" : "Inactive"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {user.role === 'Admin' ? (
                                                    <span className="text-muted-foreground text-xs italic">Restricted</span>
                                                ) : (
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button variant="ghost" size="icon" className="h-8 w-8">
                                                                <MoreHorizontal className="h-4 w-4" />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end">
                                                            <DropdownMenuItem onClick={() => {
                                                                setSelectedUser(user)
                                                                setEditDialogOpen(true)
                                                            }}>
                                                                Edit Details
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem
                                                                className="text-destructive"
                                                                onClick={() => {
                                                                    setSelectedUser(user)
                                                                    setDeactivateDialogOpen(true)
                                                                }}
                                                            >
                                                                Deactivate
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
                    )}
                </CardContent>
            </Card>

            <EditUserDialog
                user={selectedUser}
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                onUserUpdated={fetchUsers}
            />

            <AlertDialog open={deactivateDialogOpen} onOpenChange={setDeactivateDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action will deactivate the user account for
                            <span className="font-semibold"> {selectedUser?.name} </span>.
                            They will no longer be able to log in.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Deactivate User
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
