"use client"

import { cn } from "cn"
import { useRouter } from "next/navigation"
import { useState } from "react"

import type { WeightUnit } from "@/lib/units"

import { loadExerciseSeries, type AddEntryOutcome } from "../../actions"
import { normaliseShape, type SeriesShape } from "../../lib/series"
import type { ExerciseListItem, ExerciseSummary, SeriesView } from "../../queries"
import { ExercisePicker, PickedExercise } from "../exercise-picker"
import { Celebration } from "./celebration"
import { EntryForm } from "./entry-form"
import { PrTypeChooser } from "./pr-type-chooser"

/**
 * Logging a record, in three steps on one screen.
 *
 * Each step collapses to a summary row once answered, so the whole thing stays visible and
 * every earlier choice stays one click from being changed. Nothing navigates: the
 * celebration replaces the form in place, which keeps "log another" fast for someone
 * entering a training session's worth of records.
 */

interface AddPanelProps {
  exercises: ExerciseListItem[]
  unit: WeightUnit
  basePath: string
  /** Set when a coach is logging for a client. */
  athleteId?: string
}

export function AddPanel({ exercises, unit: initialUnit, basePath, athleteId }: AddPanelProps) {
  const router = useRouter()
  const [unit, setUnit] = useState(initialUnit)
  const [exercise, setExercise] = useState<ExerciseSummary | null>(null)
  const [series, setSeries] = useState<SeriesView[]>([])
  const [shape, setShape] = useState<SeriesShape | null>(null)
  const [outcome, setOutcome] = useState<AddEntryOutcome | null>(null)

  async function pickExercise(picked: ExerciseSummary) {
    setExercise(picked)
    setShape(null)
    setOutcome(null)
    setSeries(await loadExerciseSeries(picked.slug, athleteId))
  }

  function reset(keepExercise: boolean) {
    setOutcome(null)
    setShape(null)
    if (!keepExercise) {
      setExercise(null)
      setSeries([])
    }
    // The server components behind this panel hold the lists it was built from.
    router.refresh()
  }

  if (outcome) {
    return (
      <Celebration
        outcome={outcome}
        unit={unit}
        basePath={basePath}
        onLogAnother={() => reset(true)}
      />
    )
  }

  const activeSeries =
    shape && exercise
      ? (series.find((item) => {
          const target = normaliseShape(shape)
          return item.kind === target.kind && item.sets === target.sets && item.reps === target.reps
        }) ?? null)
      : null

  return (
    <div className="@container flex flex-col gap-4">
      <Step index="01" title="Movement" done={Boolean(exercise)}>
        {exercise ? (
          <PickedExercise exercise={exercise} onChange={() => reset(false)} />
        ) : (
          <ExercisePicker
            exercises={exercises}
            unit={unit}
            athleteId={athleteId}
            onPick={pickExercise}
          />
        )}
      </Step>

      {exercise && (
        <Step index="02" title="PR type" done={Boolean(shape)}>
          <PrTypeChooser series={series} unit={unit} value={shape} onChange={setShape} />
        </Step>
      )}

      {exercise && shape && (
        <Step index="03" title="The lift" done={false}>
          <EntryForm
            exercise={exercise}
            shape={shape}
            series={activeSeries}
            unit={unit}
            athleteId={athleteId}
            onLogged={setOutcome}
            onUnitChange={setUnit}
          />
        </Step>
      )}
    </div>
  )
}

function Step({
  index,
  title,
  done,
  children,
}: {
  index: string
  title: string
  done: boolean
  children: React.ReactNode
}) {
  return (
    <section className="rounded-2xl bg-card/60 p-4 ring-1 ring-foreground/10 sm:p-5">
      <h2 className="mb-4 flex items-center gap-2.5">
        <span
          className={cn(
            "grid size-6 place-items-center rounded-md font-mono text-[11px] font-semibold transition-colors",
            done ? "bg-primary/20 text-highlight" : "bg-muted text-muted-foreground",
          )}
        >
          {index}
        </span>
        <span className="font-heading text-sm font-semibold tracking-[0.18em] uppercase">
          {title}
        </span>
      </h2>
      {children}
    </section>
  )
}
