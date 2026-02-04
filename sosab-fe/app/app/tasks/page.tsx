"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Clock, MapPin, Filter } from "lucide-react"

const tasks = [
  {
    id: "1",
    title: "Inspect foundation work",
    project: "Downtown Tower",
    priority: "high",
    dueTime: "10:00 AM",
    completed: false,
  },
  {
    id: "2",
    title: "Review material delivery",
    project: "Harbor Bridge",
    priority: "medium",
    dueTime: "11:30 AM",
    completed: false,
  },
  {
    id: "3",
    title: "Update progress report",
    project: "Downtown Tower",
    priority: "low",
    dueTime: "02:00 PM",
    completed: true,
  },
  {
    id: "4",
    title: "Safety walkthrough",
    project: "Industrial Park",
    priority: "high",
    dueTime: "03:30 PM",
    completed: false,
  },
]

const priorityConfig = {
  high: { color: "text-destructive", bg: "bg-destructive/20", border: "border-destructive/30" },
  medium: { color: "text-primary", bg: "bg-primary/20", border: "border-primary/30" },
  low: { color: "text-secondary", bg: "bg-secondary/20", border: "border-secondary/30" },
}

export default function TasksPage() {
  return (
    <div className="space-y-6 p-4">
      <div className="flex items-center justify-between pt-2">
        <div>
          <h1 className="font-display text-2xl font-bold">Tasks</h1>
          <p className="text-sm text-muted-foreground">4 tasks for today</p>
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => {
          const priority = priorityConfig[task.priority]

          return (
            <Card
              key={task.id}
              className={`border-border bg-card transition-all ${task.completed ? "opacity-60" : ""}`}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={task.completed}
                    className="mt-1 border-border data-[state=checked]:bg-success data-[state=checked]:border-success"
                  />
                  <div className="flex-1 space-y-2">
                    <p className={`font-medium ${task.completed ? "line-through" : ""}`}>{task.title}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline" className={`${priority.bg} ${priority.color} ${priority.border}`}>
                        {task.priority}
                      </Badge>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {task.project}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {task.dueTime}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
