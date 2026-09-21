"use client"

import { cn } from "cn"
import { CalendarIcon } from "lucide-react"
import { useState } from "react"

import { Calendar } from "@/components/forms/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { formatDay, isDay, type Day } from "@/lib/day"

/**
 * A date, chosen from a calendar.
 *
 * Deliberately not `<input type="date">`. A native date input reports an empty string while
 * any part of it is incomplete — typing a `0` into the month blanks the value mid-keystroke
 * — so every consumer has to treat a valid-looking field as possibly empty, and one that
 * forgets takes the page down formatting it. A calendar can only ever hand back a real day
 * inside the allowed range.
 *
 * Opening the calendar clears the selection. A highlighted day answers the question before
 * the lifter has, and someone dating an old record should land on a day — not page back
 * to the right month, click away, and assume that counted. Closing without a pick reports
 * `onDismiss`, which is the consumer's cue to say a date is still needed.
 */
export function DateField({
  id,
  value,
  onChange,
  onDismiss,
  min,
  max,
  label,
  placeholder = "Pick a date",
  invalid,
  className,
}: {
  id?: string
  value: Day
  onChange: (day: Day) => void
  /** Closed without choosing a day — outside click, Escape, or the trigger again. */
  onDismiss?: () => void
  min?: Day
  max?: Day
  /** Accessible name, when there is no visible <label> pointing at `id`. */
  label?: string
  placeholder?: string
  invalid?: boolean
  className?: string
}) {
  const [open, setOpen] = useState(false)
  // Where the calendar opens once the selection has been cleared: the cleared day's month,
  // then wherever they last paged to. Unselecting must not also lose their place.
  const [anchor, setAnchor] = useState<Day>("")
  const chosen = isDay(value)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      if (chosen) {
        setAnchor(value)
        onChange("")
      }
      return
    }
    // Radix only reports the closes it caused itself: outside click, Escape, focus leaving,
    // the trigger again. Picking a day closes by setting `open` directly, so never lands
    // here.
    onDismiss?.()
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        id={id}
        type="button"
        aria-label={label}
        aria-invalid={invalid || undefined}
        className={cn(
          "flex h-12 w-full items-center gap-2.5 rounded-lg border border-input bg-transparent px-3 text-left text-base transition-colors",
          "hover:bg-muted/40 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
          "aria-invalid:border-destructive",
          className,
        )}
      >
        <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
        <span className={cn("truncate", !chosen && "text-muted-foreground/60")}>
          {chosen ? formatDay(value) : placeholder}
        </span>
      </PopoverTrigger>
      <PopoverContent>
        <Calendar
          value={value}
          min={min}
          max={max}
          initialMonth={anchor}
          onMonthChange={setAnchor}
          onSelect={(day) => {
            onChange(day)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
