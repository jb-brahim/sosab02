"use client"

import React, { Component, ErrorInfo, ReactNode } from "react"
import { AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface Props {
    children: ReactNode
}

interface State {
    hasError: boolean
    error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null,
    }

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error }
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("Uncaught error:", error, errorInfo)
    }

    public render() {
        if (this.state.hasError) {
            return (
                <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center text-destructive">
                    <AlertTriangle className="mb-4 h-10 w-10" />
                    <h2 className="mb-2 text-lg font-semibold">Something went wrong</h2>
                    <p className="mb-4 text-sm text-muted-foreground">{this.state.error?.message}</p>
                    <Button
                        variant="outline"
                        className="border-destructive/30 hover:bg-destructive/10"
                        onClick={() => this.setState({ hasError: false, error: null })}
                    >
                        Try again
                    </Button>
                </div>
            )
        }

        return this.props.children
    }
}
