"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import api from "@/lib/api"
import { Loader2 } from "lucide-react"

export default function SettingsPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [passwordData, setPasswordData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })

    // In a real app we'd fetch current user data, but for now we rely on the backend token
    // Wait, we need to show current name/email? 
    // Usually we'd get this from a useAuth hook or similar context. 
    // For now I'll adding update password form first as that's primary requirement.
    // I can also implement a basic name update if needed.

    const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPasswordData({ ...passwordData, [e.target.name]: e.target.value })
    }

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error("New passwords do not match")
            return
        }

        setIsLoading(true)
        try {
            const res = await api.put("/auth/updatepassword", {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            })

            if (res.data.success) {
                toast.success("Password updated successfully. Please login again.")
                setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" })
                // potentially logout or update token
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to update password")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your account preferences and security.</p>
            </div>

            <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="account">Account</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Details</CardTitle>
                            <CardDescription>
                                Update your personal information.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            <div className="space-y-1">
                                <Label htmlFor="name">Name</Label>
                                <Input id="name" placeholder="Your Name" />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email">Email</Label>
                                <Input id="email" placeholder="Your Email" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button>Save Changes</Button>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle>Password</CardTitle>
                            <CardDescription>
                                Change your password here. After saving, you'll be logged out.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleUpdatePassword}>
                            <CardContent className="space-y-2">
                                <div className="space-y-1">
                                    <Label htmlFor="current">Current Password</Label>
                                    <Input
                                        id="current"
                                        type="password"
                                        name="currentPassword"
                                        value={passwordData.currentPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="new">New Password</Label>
                                    <Input
                                        id="new"
                                        type="password"
                                        name="newPassword"
                                        value={passwordData.newPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor="confirm">Confirm Password</Label>
                                    <Input
                                        id="confirm"
                                        type="password"
                                        name="confirmPassword"
                                        value={passwordData.confirmPassword}
                                        onChange={handlePasswordChange}
                                        required
                                    />
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button type="submit" disabled={isLoading}>
                                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Update Password
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
