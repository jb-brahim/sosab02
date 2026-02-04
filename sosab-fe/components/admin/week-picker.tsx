"use client"

import * as React from "react"
import { Calendar as CalendarIcon } from "lucide-react"
import { format, startOfWeek, endOfWeek, getISOWeek, getYear } from "date-fns"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

interface WeekPickerProps {
    date: Date | undefined
    setDate: (date: Date | undefined) => void
    onWeekSelect: (weekStr: string) => void
}

export function WeekPicker({ date, setDate, onWeekSelect }: WeekPickerProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

    const handleSelect = (day: Date | undefined) => {
        if (!day) {
            setSelectedDate(undefined)
            setDate(undefined)
            return
        }
        setSelectedDate(day)
        setDate(day)

        // Calculate week string YYYY-W##
        const weekNum = getISOWeek(day)
        const year = getYear(day)
        // ISO week logic: use ISO week year if needed, but for simplicity here standard year
        // Actually, getISOWeek returns week of ISO year. We should use getISOWeekYear if available, 
        // or simplistic approach: YYYY-W##
        // Let's use getISOWeekYear if available or just getYear. 
        // For simplicity and matching backend likely format: 
        const weekStr = `${year}-W${weekNum.toString().padStart(2, '0')}`
        onWeekSelect(weekStr)
    }

    const displayText = selectedDate
        ? `Week ${getISOWeek(selectedDate)}, ${getYear(selectedDate)} (${format(startOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")} - ${format(endOfWeek(selectedDate, { weekStartsOn: 1 }), "MMM d")})`
        : "Select week"

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                        "w-[240px] justify-start text-left font-normal",
                        !date && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {displayText}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleSelect}
                    initialFocus
                    showOutsideDays={false}
                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
                />
            </PopoverContent>
        </Popover>
    )
}
