"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Eye, Pencil, Trash2 } from "lucide-react"

interface Project {
  id: string
  name: string
  manager: string
  progress: number
  status: "active" | "on-hold" | "completed" | "delayed"
  budget: string
  dueDate: string
}

const statusColors = {
  active: "bg-success/20 text-success border-success/30",
  "on-hold": "bg-primary/20 text-primary border-primary/30",
  completed: "bg-secondary/20 text-secondary border-secondary/30",
  delayed: "bg-destructive/20 text-destructive border-destructive/30",
}

interface ProjectTableProps {
  projects: Project[]
}

export function ProjectTable({ projects }: ProjectTableProps) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="border-border hover:bg-transparent">
            <TableHead className="text-muted-foreground">Project</TableHead>
            <TableHead className="text-muted-foreground">Manager</TableHead>
            <TableHead className="text-muted-foreground">Progress</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-muted-foreground">Budget</TableHead>
            <TableHead className="text-muted-foreground">Due Date</TableHead>
            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id} className="border-border hover:bg-muted/50">
              <TableCell className="font-medium">{project.name}</TableCell>
              <TableCell className="text-muted-foreground">{project.manager}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={project.progress} className="h-2 w-20" />
                  <span className="text-sm text-muted-foreground">{project.progress}%</span>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant="outline" className={statusColors[project.status]}>
                  {project.status}
                </Badge>
              </TableCell>
              <TableCell className="font-mono text-sm">{project.budget}</TableCell>
              <TableCell className="text-muted-foreground">{project.dueDate}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Eye className="mr-2 h-4 w-4" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
