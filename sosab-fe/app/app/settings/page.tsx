"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth-context"
import { LogOut, User, Lock, Bell } from "lucide-react"
import { useLanguage } from "@/lib/language-context"

export default function SettingsPage() {
    const { logout, user } = useAuth()
    const { t } = useLanguage()

    return (
        <div className="p-4 space-y-6 max-w-md mx-auto pb-24">
            <h1 className="text-2xl font-bold">{t("common.settings")}</h1>

            <div className="space-y-4">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <User className="w-5 h-5" /> {t("settings.profile")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase">{t("projects.full_name")}</label>
                            <div className="font-medium">{user?.name || t("common.manager")}</div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-muted-foreground uppercase">{t("projects.role_trade")}</label>
                            <div className="font-medium capitalize">{user?.role || t("common.manager")}</div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Lock className="w-5 h-5" /> {t("settings.security")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Button variant="outline" className="w-full justify-start" disabled>
                            {t("settings.change_password_soon")}
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Bell className="w-5 h-5" /> {t("settings.notifications")}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm text-muted-foreground">{t("settings.notification_authorized")}</div>
                    </CardContent>
                </Card>

                <Button
                    variant="destructive"
                    className="w-full mt-8"
                    onClick={logout}
                >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t("common.logout")}
                </Button>
            </div>
        </div>
    )
}
