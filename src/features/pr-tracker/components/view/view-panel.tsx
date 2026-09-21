"use client"

import { ChevronRightIcon, Loader2Icon } from "lucide-react"
import Link from "next/link"
import { useState, useTransition } from "react"

import type { WeightUnit } from "@/lib/units"

import { loadExerciseSeries } from "../../actions"
import { describeDay } from "@/lib/day"
import { currentRecord } from "../../lib/records"
import { KIND_LABELS, shapeChipLabel, type PrKind } from "../../lib/series"
import { formatWeightValue } from "../../lib/weight"
import type { ExerciseListItem, ExerciseSummary, SeriesView } from "../../queries"
import { PrChart } from "../chart/pr-chart"
import { ExercisePicker } from "../exercise-picker"
import { SeriesHero } from "./series-hero"

/**
 * Browsing what you have already logged.
 *
 * Pick a movement, then its one-rep max leads with a full graph and the rep and volume PR
 * types sit below in two columns — each a row with its own sparkline, so the shape of a
 * progression is readable without opening it.
 */

interface ViewPanelProps {
  exercises: ExerciseListItem[]
  unit: WeightUnit
  basePath: string
  athleteId?: string
}

export function ViewPanel({ exercises, unit, basePath, athleteId }: ViewPanelProps) {
  const [exercise, setExercise] = useState<ExerciseSummary | null>(null)
  const [series, setSeries] = useState<SeriesView[]>([])
  const [pending, startTransition] = useTransition()

  function pick(picked: ExerciseSummary) {
    setExercise(picked)
    startTransition(async () => {
      setSeries(await loadExerciseSeries(picked.slug, athleteId))
    })
  }

  if (!exercise) {
    return (
      <div className="@container rounded-2xl bg-card/60 p-4 ring-1 ring-foreground/10 sm:p-5">
        <h2 className="mb-4 font-heading text-sm font-semibold tracking-[0.18em] uppercase">
          Pick a movement
        </h2>
        <ExercisePicker exercises={exercises} unit={unit} mode="select" onPick={pick} />
      </div>
    )
  }

  const withEntries = series.filter((item) => item.entries.length > 0)
  const oneRepMax = withEntries.find((item) => item.kind === "one-rep-max") ?? null
  const hero =
    oneRepMax ?? [...withEntries].sort((a, b) => b.entries.length - a.entries.length)[0] ?? null

  return (
    <div className="flex flex-col gap-4">
      <button
        type="button"
        onClick={() => {
          setExercise(null)
          setSeries([])
        }}
        className="self-start text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        ← All movements
      </button>

      {pending && (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2Icon className="size-4 animate-spin" />
          Loading {exercise.name}
        </div>
      )}

      {!pending && !hero && (
        <p className="rounded-2xl bg-card p-8 text-center text-sm text-muted-foreground ring-1 ring-foreground/10">
          Nothing logged for {exercise.name} yet.
        </p>
      )}

      {!pending && hero && (
        <>
          <SeriesHero
            exerciseName={exercise.name}
            exerciseSlug={exercise.slug}
            series={hero}
            unit={unit}
            basePath={basePath}
            fallback={hero.kind !== "one-rep-max"}
          />

          <div className="grid gap-4 md:grid-cols-2">
            <SeriesColumn
              kind="rep"
              series={withEntries.filter((item) => item.kind === "rep")}
              exercise={exercise}
              unit={unit}
              basePath={basePath}
            />
            <SeriesColumn
              kind="volume"
              series={withEntries.filter((item) => item.kind === "volume")}
              exercise={exercise}
              unit={unit}
              basePath={basePath}
            />
          </div>
        </>
      )}
    </div>
  )
}

function SeriesColumn({
  kind,
  series,
  exercise,
  unit,
  basePath,
}: {
  kind: PrKind
  series: SeriesView[]
  exercise: ExerciseSummary
  unit: WeightUnit
  basePath: string
}) {
  return (
    <section className="flex flex-col gap-2 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <h3 className="font-heading text-sm font-semibold tracking-[0.18em] uppercase">
        {KIND_LABELS[kind]}s
      </h3>

      {series.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No {KIND_LABELS[kind].toLowerCase()}s logged for {exercise.name} yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {series.map((item) => {
            const record = currentRecord(item.entries)
            const first = item.entries[0]
            const gainKg =
              record && first && record.id !== first.id ? record.weightKg - first.weightKg : null

            return (
              <li key={item.id}>
                <Link
                  href={`${basePath}/${exercise.slug}/${item.key}`}
                  className="group flex items-center gap-3 rounded-xl p-2.5 transition-colors hover:bg-muted/60"
                >
                  <span className="w-14 shrink-0 font-mono text-sm font-medium tabular-nums">
                    {shapeChipLabel(item)}
                  </span>

                  {/* A sparkline makes the shape of a progression readable at a glance. */}
                  <span className="hidden w-20 shrink-0 sm:block">
                    <PrChart entries={item.entries} unit={unit} height={32} spark />
                  </span>

                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium tabular-nums">
                      {record ? `${formatWeightValue(record.weightKg, unit)} ${unit}` : "—"}
                      {gainKg !== null && gainKg > 0 && (
                        <span className="ml-1.5 text-xs font-normal text-chart-4">
                          +{formatWeightValue(gainKg, unit)}
                        </span>
                      )}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {item.entries.length} record{item.entries.length === 1 ? "" : "s"}
                      {record && ` · ${describeDay(record.achievedOn)}`}
                    </span>
                  </span>

                  <ChevronRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
