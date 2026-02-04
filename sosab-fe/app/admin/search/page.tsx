"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import api from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, FolderKanban, Users, MapPin, Building2, Phone, User, Package } from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function SearchPage() {
    const searchParams = useSearchParams()
    const query = searchParams.get("q") || ""

    // State
    const [isLoading, setIsLoading] = useState(false)
    const [projects, setProjects] = useState<any[]>([])
    const [workers, setWorkers] = useState<any[]>([])
    const [users, setUsers] = useState<any[]>([])
    const [materials, setMaterials] = useState<any[]>([])

    useEffect(() => {
        if (!query) return

        const performSearch = async () => {
            setIsLoading(true)
            try {
                // Fetch projects
                try {
                    const projectRes = await api.get("/projects")
                    if (projectRes.data.success) {
                        const allProjects = projectRes.data.data
                        const filteredProjects = allProjects.filter((p: any) =>
                            (p.name || "").toLowerCase().includes(query.toLowerCase()) ||
                            (p.location || "").toLowerCase().includes(query.toLowerCase())
                        )
                        setProjects(filteredProjects)
                    }
                } catch (e) {
                    console.error("Failed to fetch projects", e)
                }

                // Fetch workers
                try {
                    const workerRes = await api.get("/workers/admin/all")
                    if (workerRes.data.success) {
                        const allWorkers = workerRes.data.data
                        const filteredWorkers = allWorkers.filter((w: any) =>
                            (w.name || "").toLowerCase().includes(query.toLowerCase()) ||
                            (w.trade || "").toLowerCase().includes(query.toLowerCase())
                        )
                        setWorkers(filteredWorkers)
                    }
                } catch (e) {
                    console.error("Failed to fetch workers", e)
                }

                // Fetch users
                try {
                    const userRes = await api.get("/users")
                    if (userRes.data.success) {
                        const allUsers = userRes.data.data
                        const filteredUsers = allUsers.filter((u: any) =>
                            (u.name || "").toLowerCase().includes(query.toLowerCase()) ||
                            (u.email || "").toLowerCase().includes(query.toLowerCase())
                        )
                        setUsers(filteredUsers)
                    }
                } catch (e) {
                    console.error("Failed to fetch users", e)
                }

                // Fetch materials (depot)
                try {
                    const matRes = await api.get("/materials/depot/all")
                    if (matRes.data.success) {
                        const allMaterials = matRes.data.data
                        const filteredMaterials = allMaterials.filter((m: any) =>
                            (m.name || "").toLowerCase().includes(query.toLowerCase()) ||
                            (m.category || "").toLowerCase().includes(query.toLowerCase())
                        )
                        setMaterials(filteredMaterials)
                    }
                } catch (e) {
                    console.error("Failed to fetch materials", e)
                }

            } catch (error) {
                console.error("Search failed", error)
            } finally {
                setIsLoading(false)
            }
        }

        performSearch()

    }, [query])

    if (!query) {
        return (
            <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                <SearchIcon className="h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg">Enter a keyword to search projects, workers, users, and materials.</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Search Results</h1>
                <p className="text-muted-foreground">
                    Found {projects.length} projects, {workers.length} workers, {users.length} users, and {materials.length} materials matching "{query}"
                </p>
            </div>

            {isLoading ? (
                <div className="flex h-40 items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <Tabs defaultValue="projects">
                    <TabsList>
                        <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
                        <TabsTrigger value="workers">Workers ({workers.length})</TabsTrigger>
                        <TabsTrigger value="users">Users ({users.length})</TabsTrigger>
                        <TabsTrigger value="materials">Materials ({materials.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="projects" className="space-y-4 mt-4">
                        {projects.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No projects found matching your query.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {projects.map(project => (
                                    <Link href={`/admin/projects/${project._id}`} key={project._id}>
                                        <Card className="hover:border-primary/50 transition-colors h-full">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex items-start justify-between">
                                                    <span className="truncate">{project.name}</span>
                                                    <Badge variant={project.status === 'In Progress' ? 'default' : 'secondary'}>
                                                        {project.status}
                                                    </Badge>
                                                </CardTitle>
                                                <CardDescription className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {project.location}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-sm text-muted-foreground">
                                                    Manager: {project.managerId?.name || "Unassigned"}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="workers" className="space-y-4 mt-4">
                        {workers.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No workers found matching your query.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {workers.map(worker => (
                                    <Link
                                        href={worker.projectId?._id ? `/admin/projects/${worker.projectId._id}` : "/admin/workers"}
                                        key={worker._id}
                                    >
                                        <Card className="hover:border-primary/50 transition-colors h-full">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Users className="h-5 w-5 text-muted-foreground" />
                                                    {worker.name}
                                                </CardTitle>
                                                <CardDescription>
                                                    {worker.trade}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="h-4 w-4 opacity-70" />
                                                    <span>{worker.projectId?.name || "Unassigned"}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone className="h-4 w-4 opacity-70" />
                                                    <span>{worker.contact?.phone || "No Phone"}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="users" className="space-y-4 mt-4">
                        {users.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No users found matching your query.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {users.map(user => (
                                    <Link href="/admin/users" key={user._id}>
                                        <Card className="hover:border-primary/50 transition-colors h-full">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex items-center gap-2">
                                                    <User className="h-5 w-5 text-muted-foreground" />
                                                    {user.name}
                                                </CardTitle>
                                                <CardDescription>
                                                    {user.email}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm">
                                                <Badge variant="outline" className="capitalize">{user.role}</Badge>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="materials" className="space-y-4 mt-4">
                        {materials.length === 0 ? (
                            <div className="text-center py-10 text-muted-foreground">
                                No materials found matching your query.
                            </div>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                {materials.map(material => (
                                    <Link href="/admin/depot" key={material._id}>
                                        <Card className="hover:border-primary/50 transition-colors h-full">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="flex items-center gap-2">
                                                    <Package className="h-5 w-5 text-muted-foreground" />
                                                    {material.name}
                                                </CardTitle>
                                                <CardDescription>
                                                    {material.category}
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-2 text-sm">
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Quantity:</span>
                                                    <span className="font-medium">{material.quantity} {material.unit}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-muted-foreground">Min Quantity:</span>
                                                    <span className="font-medium">{material.minQuantity} {material.unit}</span>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            )}
        </div>
    )
}

function SearchIcon(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
        </svg>
    )
}
