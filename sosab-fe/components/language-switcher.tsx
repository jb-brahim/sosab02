"use client"

import * as React from "react"
import { Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/lib/language-context"

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage()

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="group">
                    <Languages className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                    <span className="sr-only">Toggle language</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[120px]">
                <DropdownMenuItem
                    onClick={() => setLanguage("en")}
                    className={language === "en" ? "bg-primary/10 text-primary font-medium" : ""}
                >
                    English
                </DropdownMenuItem>
                <DropdownMenuItem
                    onClick={() => setLanguage("fr")}
                    className={language === "fr" ? "bg-primary/10 text-primary font-medium" : ""}
                >
                    Français
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
