import { ArrowLeftIcon } from "lucide-react"
import Link from "next/link"

import type { WeightUnit } from "@/lib/units"

import { describeDay } from "../../lib/day"
import { currentRecord } from "../../lib/records"
import { seriesLabel, seriesTitle } from "../../lib/series"
import { formatWeightValue } from "../../lib/weight"
import type { ExerciseSummary, SeriesView } from "../../queries"
import { PrChart } from "../chart/pr-chart"
import { EntryList } from "./entry-list"

/**
 * One PR type in full: the graph, then every record behind it.
 *
 * Rendered identically for the lifter and for a coach looking at their client's history —
 * only `basePath` and `athleteId` differ, which is what "the admin sees exactly what the
 * client sees" means in practice.
 */
export function SeriesPage({
  exercise,
  series,
  unit,
  basePath,
  backLabel,
  athleteId,
}: {
  exercise: ExerciseSummary
  series: SeriesView
  unit: WeightUnit
  basePath: string
  backLabel: string
  athleteId?: string
}) {
  const record = currentRecord(series.entries)
  const first = series.entries[0]
  const gainKg = record && first && record.id !== first.id ? record.weightKg - first.weightKg : null

  return (
    <div className="flex flex-col gap-6">
      <Link
        href={basePath}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {backLabel}
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-heading text-xs font-semibold tracking-[0.18em] text-highlight uppercase">
            {seriesLabel(series)}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight uppercase sm:text-4xl">
            {exercise.name}
          </h1>
        </div>
        {record && (
          <div className="text-right">
            <p className="font-heading text-4xl font-bold tabular-nums">
              {formatWeightValue(record.weightKg, unit)}
              <span className="ml-1 text-lg font-medium text-muted-foreground">{unit}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              current record · {describeDay(record.achievedOn)}
              {gainKg !== null && gainKg > 0 && (
                <span className="ml-1.5 text-chart-4">
                  +{formatWeightValue(gainKg, unit)} {unit} since the first
                </span>
              )}
            </p>
          </div>
        )}
      </header>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <PrChart
          entries={series.entries}
          unit={unit}
          height={340}
          label={`${seriesTitle(exercise.name, series)}: ${series.entries.length} records`}
        />
      </section>

      <section className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <h2 className="mb-2 font-heading text-sm font-semibold tracking-[0.18em] uppercase">
          Every record
        </h2>
        <EntryList entries={series.entries} unit={unit} athleteId={athleteId} />
      </section>
    </div>
  )
}
