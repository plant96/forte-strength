"use client"

import { ArrowRightIcon, TrendingUpIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import type { WeightUnit } from "@/lib/units"

import { describeDay, formatDay } from "@/lib/day"
import { currentRecord } from "../../lib/records"
import { seriesLabel, seriesTitle } from "../../lib/series"
import { formatWeightValue } from "../../lib/weight"
import type { SeriesView } from "../../queries"
import { PrChart } from "../chart/pr-chart"

/**
 * The headline graph for a movement — its one-rep max where there is one, otherwise
 * whichever PR type has the most history behind it, so the panel never leads with an
 * empty chart just because nobody has tested a single yet.
 */
export function SeriesHero({
  exerciseName,
  exerciseSlug,
  series,
  unit,
  basePath,
  fallback,
}: {
  exerciseName: string
  exerciseSlug: string
  series: SeriesView
  unit: WeightUnit
  basePath: string
  /** True when this isn't the 1RM, so the copy can say why. */
  fallback: boolean
}) {
  const record = currentRecord(series.entries)
  const first = series.entries[0]
  const gainKg = record && first && record.id !== first.id ? record.weightKg - first.weightKg : null
  const href = `${basePath}/${exerciseSlug}/${series.key}`

  return (
    <section className="flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-heading text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            {fallback ? seriesLabel(series) : "One rep max"}
          </p>
          <h2 className="mt-1 font-heading text-2xl font-bold tracking-tight uppercase">
            {exerciseName}
          </h2>
          {fallback && (
            <p className="mt-1 text-sm text-muted-foreground">
              No one-rep max logged yet — showing your most-tracked PR type instead.
            </p>
          )}
        </div>

        {record && (
          <div className="text-right">
            <p className="font-heading text-4xl font-bold tabular-nums">
              {formatWeightValue(record.weightKg, unit)}
              <span className="ml-1 text-lg font-medium text-muted-foreground">{unit}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              set {describeDay(record.achievedOn)}
              {gainKg !== null && gainKg > 0 && (
                <span className="ml-1.5 inline-flex items-center gap-0.5 text-chart-4">
                  <TrendingUpIcon className="size-3" />+{formatWeightValue(gainKg, unit)} {unit} all
                  time
                </span>
              )}
            </p>
          </div>
        )}
      </div>

      <PrChart
        entries={series.entries}
        unit={unit}
        height={300}
        label={`${seriesTitle(exerciseName, series)}: ${series.entries.length} records`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-sm">
          {series.entries
            .slice(-3)
            .reverse()
            .map((entry) => (
              <li key={entry.id} className="flex items-baseline gap-1.5">
                <span className="font-medium tabular-nums">
                  {formatWeightValue(entry.weightKg, unit)} {unit}
                </span>
                <span className="text-xs text-muted-foreground">{formatDay(entry.achievedOn)}</span>
              </li>
            ))}
        </ul>
        <Button variant="outline" size="sm" className="h-9" asChild>
          <Link href={href}>
            All {series.entries.length} records
            <ArrowRightIcon />
          </Link>
        </Button>
      </div>
    </section>
  )
}
