"use client"

import { useEffect, useState } from "react"
import api from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, Users, HardHat, Eye } from "lucide-react"
import { toast } from "sonner"
import { CreateWorkerDialog } from "@/components/admin/create-worker-dialog"
import { ProjectWorkersDialog } from "@/components/admin/project-workers-dialog"

interface Project {
    _id: string
    name: string
    managerId: {
        _id: string
        name: string
        email: string
    }
    // Add other fields if necessary
}

export default function WorkersPage() {
    const [projects, setProjects] = useState<Project[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Project View State
    const [selectedProject, setSelectedProject] = useState<{ id: string, name: string } | null>(null)
    const [projectWorkersDialogOpen, setProjectWorkersDialogOpen] = useState(false)

    const fetchProjects = async () => {
        setIsLoading(true)
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

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-display text-3xl font-bold tracking-tight">Workers</h1>
                    <p className="text-muted-foreground mt-1">Manage construction workforce by project.</p>
                </div>
                <CreateWorkerDialog onWorkerCreated={() => {
                    // Ideally we might want to refresh project stats if we had worker counts
                }} />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <HardHat className="h-5 w-5 text-primary" />
                        Projects Directory
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
                                    <TableHead>Manager</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {projects.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">
                                            No active projects found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    projects.map((project) => (
                                        <TableRow key={project._id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                                            setSelectedProject({
                                                id: project._id,
                                                name: project.name
                                            })
                                            setProjectWorkersDialogOpen(true)
                                        }}>
                                            <TableCell className="font-medium text-lg">{project.name}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                                        {project.managerId?.name?.charAt(0) || "M"}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{project.managerId?.name || "Unassigned"}</div>
                                                        <div className="text-xs text-muted-foreground">{project.managerId?.email}</div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation(); // Prevent row click
                                                        setSelectedProject({
                                                            id: project._id,
                                                            name: project.name
                                                        })
                                                        setProjectWorkersDialogOpen(true)
                                                    }}
                                                >
                                                    <Users className="h-4 w-4 mr-2" />
                                                    View Workers
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <ProjectWorkersDialog
                projectId={selectedProject?.id || null}
                projectName={selectedProject?.name || null}
                open={projectWorkersDialogOpen}
                onOpenChange={setProjectWorkersDialogOpen}
            />
        </div>
    )
}
