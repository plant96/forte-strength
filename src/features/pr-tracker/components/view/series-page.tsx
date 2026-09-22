import { ArrowLeftIcon, PlusIcon, TrophyIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

import type { WeightUnit } from "@/lib/units"

import { describeDay } from "@/lib/day"
import { currentRecord } from "../../lib/records"
import { seriesLabel, seriesTitle, type SeriesShape } from "../../lib/series"
import { formatWeightValue } from "../../lib/weight"
import type { ExerciseSummary, SeriesView } from "../../queries"
import { PrChart } from "../chart/pr-chart"
import { StatRow } from "../stat-row"
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
  shape,
  series,
  unit,
  basePath,
  backLabel,
  athleteId,
}: {
  exercise: ExerciseSummary
  /** Comes from the URL, so the page can name itself even with nothing logged. */
  shape: SeriesShape
  series: SeriesView | null
  unit: WeightUnit
  basePath: string
  backLabel: string
  athleteId?: string
}) {
  if (!series) {
    return (
      <EmptySeries exercise={exercise} shape={shape} basePath={basePath} backLabel={backLabel} />
    )
  }

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

      <StatRow as="header" className="items-end gap-x-6 gap-y-2">
        <div className="min-w-0">
          <p className="font-heading text-xs font-semibold tracking-[0.18em] text-highlight uppercase">
            {seriesLabel(shape)}
          </p>
          <h1 className="mt-1 font-heading text-3xl font-bold tracking-tight uppercase sm:text-4xl">
            {exercise.name}
          </h1>
        </div>
        {/* Beside the title while the number fits there, below it only when it does not. */}
        {record && (
          <div className="flex-1 text-right group-data-[stacked=true]:text-left">
            <p className="font-heading text-4xl font-bold whitespace-nowrap tabular-nums">
              {formatWeightValue(record.weightKg, unit)}
              <span className="ml-1 text-lg font-medium text-muted-foreground">{unit}</span>
            </p>
            <p className="flex flex-wrap justify-end gap-x-1.5 text-xs text-muted-foreground group-data-[stacked=true]:justify-start">
              <span className="whitespace-nowrap">
                current record · {describeDay(record.achievedOn)}
              </span>
              {gainKg !== null && gainKg > 0 && (
                <span className="whitespace-nowrap text-chart-4">
                  +{formatWeightValue(gainKg, unit)} {unit} since the first
                </span>
              )}
            </p>
          </div>
        )}
      </StatRow>

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

/**
 * What is left after the last record on a series is deleted. The series row itself is gone
 * by then, but the movement and the URL are still perfectly valid — so this says what
 * happened instead of pretending the page never existed.
 */
function EmptySeries({
  exercise,
  shape,
  basePath,
  backLabel,
}: {
  exercise: ExerciseSummary
  shape: SeriesShape
  basePath: string
  backLabel: string
}) {
  return (
    <div className="flex flex-col gap-6">
      <Link
        href={basePath}
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {backLabel}
      </Link>

      <div className="flex flex-col items-center gap-4 rounded-2xl bg-card px-6 py-16 text-center ring-1 ring-foreground/10">
        <span className="grid size-12 place-items-center rounded-xl bg-muted text-muted-foreground">
          <TrophyIcon className="size-5" />
        </span>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-tight uppercase">
            No records here yet
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Nothing is logged for the {seriesLabel(shape).toLowerCase()} on {exercise.name}.
          </p>
        </div>
        <Button asChild className="h-10">
          <Link href={`${basePath}?panel=add`}>
            <PlusIcon />
            Log a record
          </Link>
        </Button>
      </div>
    </div>
  )
}
