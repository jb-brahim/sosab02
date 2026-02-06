"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LogOut, User, Lock, Bell } from "lucide-react"

export default function SettingsPage() {
    const { logout, user } = useAuth()

    return (
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
            <h1 className="text-2xl font-bold">Settings</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5" /> Profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Name</label>
                            <div className="font-medium">{user?.name || "Manager"}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase">Role</label>
                            <div className="font-medium capitalize">{user?.role || "Manager"}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Lock className="w-5 h-5" /> Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full justify-start" disabled>
                            Change Password (Coming Soon)
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="w-5 h-5" /> Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">Notification settings will be available in authorized updates.</div>
                    </CardContent>
                </Card>

                <Button
                    variant="destructive"
                    className="w-full mt-8"
                    onClick={logout}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    )
}
