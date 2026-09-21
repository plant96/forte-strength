import { CalendarDaysIcon, DumbbellIcon, TrophyIcon } from "lucide-react"

import { describeDay, monthsBetween, today } from "@/lib/day"
import type { TrackerSummary } from "../queries"

const paceFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })

/**
 * The running totals at the top of the View panel's movement list — small, factual, and
 * the quiet reward for logging. They describe the whole history, so they sit only on the
 * page that is about the whole history: not on the Add panel, and not on a movement.
 */
export function SummaryStrip({ summary }: { summary: TrackerSummary }) {
  // Records per month since the first one. Under a month of history counts as a month, so
  // a first week of logging reads as a pace rather than a spike.
  const months = summary.firstDay ? monthsBetween(summary.firstDay, today()) : Number.NaN
  const pace = Number.isFinite(months) ? summary.recordCount / Math.max(1, months) : null

  const tiles = [
    {
      icon: DumbbellIcon,
      value: String(summary.exerciseCount),
      label: summary.exerciseCount === 1 ? "Movement tracked" : "Movements tracked",
    },
    {
      icon: TrophyIcon,
      value: String(summary.recordCount),
      label: summary.recordCount === 1 ? "Record set" : "Records set",
    },
    {
      icon: CalendarDaysIcon,
      value: pace !== null ? paceFormat.format(pace) : "—",
      label: "Average monthly PRs",
    },
  ]

  return (
    <div className="grid grid-cols-3 gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-foreground/10">
      {tiles.map((tile) => (
        <div key={tile.label} className="flex flex-col gap-1 bg-card p-4">
          <tile.icon className="size-4 text-highlight" />
          <p className="font-heading text-xl font-bold tabular-nums sm:text-2xl">{tile.value}</p>
          <p className="text-xs leading-snug text-muted-foreground">{tile.label}</p>
        </div>
      ))}
      {summary.lastDay && (
        <p className="col-span-3 bg-card px-4 pt-3 pb-3 text-xs text-muted-foreground">
          Last record {describeDay(summary.lastDay)}.
        </p>
      )}
    </div>
  )
}
