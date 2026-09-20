import { DumbbellIcon, TrendingUpIcon, TrophyIcon } from "lucide-react"

import type { WeightUnit } from "@/lib/units"

import { describeDay } from "../lib/day"
import { formatWeightValue } from "../lib/weight"
import type { TrackerSummary } from "../queries"

/** The running totals above the panels — small, factual, and the quiet reward for logging. */
export function SummaryStrip({ summary, unit }: { summary: TrackerSummary; unit: WeightUnit }) {
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
      icon: TrendingUpIcon,
      value:
        summary.biggestJumpKg !== null
          ? `+${formatWeightValue(summary.biggestJumpKg, unit)} ${unit}`
          : "—",
      label: "Biggest single jump",
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
        <p className="col-span-3 bg-card px-4 pb-3 text-xs text-muted-foreground">
          Last record {describeDay(summary.lastDay)}.
        </p>
      )}
    </div>
  )
}
