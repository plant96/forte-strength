"use client"

import { cn } from "cn"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  addMonths,
  dayParts,
  daysInMonth,
  firstWeekday,
  isDay,
  makeDay,
  today,
  type Day,
} from "@/lib/day"

/**
 * A month grid, built here rather than pulled in.
 *
 * The one thing a date picker on this site has to do well is birthdays, and paging a
 * calendar back thirty years one month at a time is not a date picker. So the header is
 * two dropdowns — month and year — with the arrows as a convenience rather than the only
 * way through. Days outside `min`/`max` are disabled, which means the value handed back is
 * always a real, in-range date; nothing downstream has to defend against a half-typed one.
 */

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/** Sunday-first, matching the rest of the site's US conventions. */
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"]

/**
 * Six rows of seven, whatever the month. A grid that grew a row between months would
 * change the popover's height, and floating-ui re-runs its collision check on resize —
 * which is how paging from one month to the next used to flip the calendar to the other
 * side of the field.
 */
const GRID_CELLS = 42

interface CalendarProps {
  /** The selected day, or "" when nothing is chosen yet. */
  value: Day
  onSelect: (day: Day) => void
  min?: Day
  max?: Day
  /** The month to open on when nothing is selected. Any day inside it will do. */
  initialMonth?: Day
  /** Reports the first of the month whenever the visible month changes. */
  onMonthChange?: (firstOfMonth: Day) => void
}

export function Calendar({
  value,
  onSelect,
  min,
  max,
  initialMonth,
  onMonthChange,
}: CalendarProps) {
  const now = today()
  // Opens on the selected month, else the month asked for, else as close to the allowed
  // range as today gets.
  const initial =
    dayParts(value) ??
    dayParts(initialMonth ?? "") ??
    dayParts(clampToRange(now, min, max)) ??
    dayParts(now)!
  const [view, setView] = useState({ year: initial.year, month: initial.month })

  const minYear = dayParts(min ?? "")?.year ?? 1900
  const maxYear = dayParts(max ?? "")?.year ?? dayParts(now)!.year
  const years: number[] = []
  for (let year = maxYear; year >= minYear; year--) years.push(year)

  const total = daysInMonth(view.year, view.month)
  const leading = firstWeekday(view.year, view.month)
  const cells: (Day | null)[] = [
    ...Array.from({ length: leading }, () => null),
    ...Array.from({ length: total }, (_, index) => makeDay(view.year, view.month, index + 1)),
  ]
  cells.push(...Array.from({ length: GRID_CELLS - cells.length }, () => null))

  function changeView(next: { year: number; month: number }) {
    setView(next)
    onMonthChange?.(makeDay(next.year, next.month, 1))
  }

  function shift(months: number) {
    const anchor = makeDay(view.year, view.month, 1)
    const next = dayParts(addMonths(anchor, months))
    if (next) changeView({ year: next.year, month: next.month })
  }

  const firstOfView = makeDay(view.year, view.month, 1)
  const lastOfView = makeDay(view.year, view.month, total)
  const canGoBack = !min || !isDay(min) || firstOfView > min
  const canGoForward = !max || !isDay(max) || lastOfView < max

  return (
    <div className="w-64">
      <div className="mb-3 flex items-center gap-1.5">
        <Select
          value={String(view.month)}
          onValueChange={(month) => changeView({ ...view, month: Number(month) })}
        >
          <SelectTrigger className="h-8 flex-1" aria-label="Month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper">
            {MONTH_NAMES.map((name, index) => (
              <SelectItem key={name} value={String(index + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={String(view.year)}
          onValueChange={(year) => changeView({ ...view, year: Number(year) })}
        >
          <SelectTrigger className="h-8 w-[5.25rem]" aria-label="Year">
            <SelectValue />
          </SelectTrigger>
          <SelectContent position="popper" className="max-h-64">
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <ArrowButton label="Previous month" disabled={!canGoBack} onClick={() => shift(-1)}>
          <ChevronLeftIcon className="size-4" />
        </ArrowButton>
        <ArrowButton label="Next month" disabled={!canGoForward} onClick={() => shift(1)}>
          <ChevronRightIcon className="size-4" />
        </ArrowButton>
      </div>

      <div className="grid grid-cols-7 gap-0.5" role="grid">
        {WEEKDAYS.map((weekday) => (
          <div
            key={weekday}
            className="pb-1 text-center text-[11px] font-medium text-muted-foreground"
          >
            {weekday}
          </div>
        ))}

        {cells.map((day, index) => {
          // Sized like a day, or a row of nothing but padding would collapse to nothing.
          if (!day) return <div key={`pad-${index}`} className="size-8" />

          const disabled = Boolean((min && day < min) || (max && day > max))
          const selected = day === value
          const isToday = day === now

          return (
            <button
              key={day}
              type="button"
              disabled={disabled}
              aria-pressed={selected}
              aria-current={isToday ? "date" : undefined}
              onClick={() => onSelect(day)}
              className={cn(
                "grid size-8 place-items-center rounded-md text-sm tabular-nums transition-colors",
                "disabled:pointer-events-none disabled:opacity-25",
                selected
                  ? "bg-primary font-semibold text-primary-foreground"
                  : isToday
                    ? "text-highlight ring-1 ring-primary/40 hover:bg-muted"
                    : "text-foreground hover:bg-muted",
              )}
            >
              {Number(day.slice(8))}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function ArrowButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-30"
    >
      {children}
    </button>
  )
}

function clampToRange(day: Day, min?: Day, max?: Day): Day {
  if (min && isDay(min) && day < min) return min
  if (max && isDay(max) && day > max) return max
  return day
}
