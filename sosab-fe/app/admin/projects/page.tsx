"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2, MoreHorizontal, FolderKanban } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { CreateProjectDialog } from "@/components/admin/create-project-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"

import { useLanguage } from "@/lib/language-context"

interface Project {
    _id: string
    name: string
    location: string
    status: "active" | "completed" | "on-hold" | "planning"
    startDate: string
    endDate: string
    manager: { name: string } | null
}

const statusColors: Record<string, string> = {
    active: "bg-success/20 text-success border-success/30",
    completed: "bg-primary/20 text-primary border-primary/30",
    "on-hold": "bg-warning/20 text-warning border-warning/30",
    planning: "bg-secondary/20 text-secondary border-secondary/30",
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const { t, language } = useLanguage()
    const isRTL = language === "ar"

    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
    const router = useRouter()

    const fetchProjects = async () => {
        try {
            const res = await api.get("/projects")
            if (res.data.success) {
                setProjects(res.data.data)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to fetch projects")
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchProjects()
    }, [])

    const handleDelete = async () => {
        if (!selectedProject) return
        try {
            const res = await api.delete(`/projects/${selectedProject._id}`)
            if (res.data.success) {
                toast.success(t("projects.delete_success") || "Project deleted successfully")
                fetchProjects()
                setDeleteDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to delete project")
        }
    }

    return (
        <div className="space-y-6">
            <div className={cn("flex items-center justify-between", isRTL && "flex-row-reverse")}>
                <div className={isRTL ? "text-right" : "text-left"}>
                    <h1 className="font-display text-3xl font-bold tracking-tight">{t("projects.title") || "Projects"}</h1>
                    <p className="text-muted-foreground mt-1">{t("projects.description") || "Track construction site progress."}</p>
                </div>
                <div className={cn("flex gap-2", isRTL && "flex-row-reverse")}>
                    <CreateProjectDialog onProjectCreated={fetchProjects} />
                </div>
            </div>

            <Card className={isRTL ? "text-right" : "text-left"}>
                <CardHeader className={cn(isRTL && "flex-row-reverse")}>
                    <CardTitle className={cn("flex items-center gap-2", isRTL && "flex-row-reverse")}>
                        <FolderKanban className="h-5 w-5 text-primary" />
                        {t("projects.all_projects") || "All Projects"}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex h-40 items-center justify-center">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : (
                        <Table dir={isRTL ? "rtl" : "ltr"}>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("projects.project_name") || "Project Name"}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("projects.location_label") || "Location"}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("projects.manager") || "Manager"}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("projects.timeline") || "Timeline"}</TableHead>
                                    <TableHead className={isRTL ? "text-right" : ""}>{t("common.actions") || "Actions"}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center h-24 text-muted-foreground">
                                            {t("common.no_results") || "No projects found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    projects.map((project) => (
                                        <TableRow
                                            key={project._id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/admin/projects/${project._id}`)}
                                        >
                                            <TableCell className="font-medium text-primary">
                                                {project.name}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{project.location}</TableCell>
                                            <TableCell>{project.manager?.name || t("common.unassigned") || "Unassigned"}</TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align={isRTL ? "start" : "end"}>
                                                        <DropdownMenuItem onClick={() => router.push(`/admin/projects/${project._id}`)}>
                                                            {t("common.view") || "View Details"}
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="text-destructive focus:text-destructive"
                                                            onClick={() => {
                                                                setSelectedProject(project)
                                                                setDeleteDialogOpen(true)
                                                            }}
                                                        >
                                                            {t("common.delete") || "Delete"}
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className={isRTL ? "text-right" : ""}>
                            {t("projects.delete_confirm_title") || "Are you absolutely sure?"}
                        </AlertDialogTitle>
                        <AlertDialogDescription className={isRTL ? "text-right" : ""}>
                            {t("projects.delete_confirm_desc") || "This action cannot be undone. This will permanently delete the project and remove all associated data."}
                            <span className="font-bold block mt-2">{selectedProject?.name}</span>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className={isRTL ? "flex-row-reverse gap-2" : ""}>
                        <AlertDialogCancel>{t("common.cancel") || "Cancel"}</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {t("common.delete") || "Delete Project"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
