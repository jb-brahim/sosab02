"use client"

import * as React from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"

interface Option {
    label: string
    value: string
}

interface MultiSelectProps {
    options: Option[]
    selected: string[]
    onChange: (selected: string[]) => void
    placeholder?: string
    className?: string
}

export function MultiSelect({
    options,
    selected,
    onChange,
    placeholder = "Select options...",
    className,
}: MultiSelectProps) {
    const [open, setOpen] = React.useState(false)

    const handleUnselect = (value: string) => {
        onChange(selected.filter((s) => s !== value))
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "w-full justify-between min-h-10 h-auto py-2 block",
                        className
                    )}
                >
                    <div className="flex flex-wrap gap-1 items-center justify-between w-full">
                        <div className="flex flex-wrap gap-1 flex-1 overflow-hidden">
                            {selected.length > 0 ? (
                                options
                                    .filter((option) => selected.includes(option.value))
                                    .map((option) => (
                                        <Badge
                                            key={option.value}
                                            variant="secondary"
                                            className="max-w-full inline-flex items-center"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleUnselect(option.value)
                                            }}
                                        >
                                            <span className="truncate text-left" style={{ maxWidth: 'calc(100vw - 150px)' }}>
                                                {option.label}
                                            </span>
                                            <X className="ml-1 h-3 w-3 shrink-0 cursor-pointer" />
                                        </Badge>
                                    ))
                            ) : (
                                <span className="text-muted-foreground">{placeholder}</span>
                            )}
                        </div>
                        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50 ml-2" />
                    </div>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
                <div className="max-h-64 overflow-auto p-2">
                    {options.map((option) => (
                        <div
                            key={option.value}
                            className="flex items-center space-x-2 p-2 hover:bg-accent rounded-sm cursor-pointer"
                            onClick={() => {
                                const isSelected = selected.includes(option.value)
                                if (isSelected) {
                                    onChange(selected.filter((s) => s !== option.value))
                                } else {
                                    onChange([...selected, option.value])
                                }
                            }}
                        >
                            <Checkbox
                                checked={selected.includes(option.value)}
                                onCheckedChange={() => { }} // Controlled by parent div click
                            />
                            <span className="flex-1 text-sm leading-tight text-left">{option.label}</span>
                        </div>
                    ))}
                    {options.length === 0 && (
                        <div className="p-4 text-center text-sm text-muted-foreground">
                            No options found.
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    )
}
