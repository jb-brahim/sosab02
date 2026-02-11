"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus, Loader2, MoreHorizontal, FolderKanban, Archive } from "lucide-react"
import { toast } from "sonner"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { CreateProjectDialog } from "@/components/admin/create-project-dialog"
import { UpdateProjectStatusDialog } from "@/components/admin/update-project-status-dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { useRouter } from "next/navigation"

interface Project {
    _id: string
    name: string
    location: string
    status: "active" | "completed" | "on-hold" | "planning"
    startDate: string
    endDate: string
    budget: number
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

    const [selectedProject, setSelectedProject] = useState<Project | null>(null)
    const [statusDialogOpen, setStatusDialogOpen] = useState(false)
    const [archiveDialogOpen, setArchiveDialogOpen] = useState(false)
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

    const handleArchive = async () => {
        if (!selectedProject) return
        try {
            const res = await api.delete(`/projects/${selectedProject._id}`)
            if (res.data.success) {
                toast.success("Project archived successfully")
                fetchProjects()
                setArchiveDialogOpen(false)
            }
        } catch (error: any) {
            toast.error(error.message || "Failed to archive project")
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Projects</h1>
                    <p className="text-muted-foreground mt-1">Track construction site progress.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => router.push("/admin/projects/archives")}>
                        <Archive className="h-4 w-4 mr-2" />
                        Archives
                    </Button>
                    <CreateProjectDialog onProjectCreated={fetchProjects} />
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FolderKanban className="h-5 w-5 text-primary" />
                        All Projects
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
                                    <TableHead>Project Name</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Manager</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead>Timeline</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                                            No projects found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    projects.map((project) => (
                                        <TableRow
                                            key={project._id}
                                            className="cursor-pointer hover:bg-muted/50"
                                            onClick={() => router.push(`/admin/projects/${project._id}`)}
                                        >
                                            <TableCell className="font-medium">{project.name}</TableCell>
                                            <TableCell className="text-muted-foreground">{project.location}</TableCell>
                                            <TableCell>{project.manager?.name || "Unassigned"}</TableCell>
                                            <TableCell>{project.budget?.toLocaleString()} TND</TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {new Date(project.startDate).toLocaleDateString()} - {new Date(project.endDate).toLocaleDateString()}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <UpdateProjectStatusDialog
                project={selectedProject}
                open={statusDialogOpen}
                onOpenChange={setStatusDialogOpen}
                onStatusUpdated={fetchProjects}
            />

            <AlertDialog open={archiveDialogOpen} onOpenChange={setArchiveDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the project
                            <span className="font-semibold"> {selectedProject?.name} </span>
                            and remove all associated data.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleArchive} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            Archive Project
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div >
    )
}
