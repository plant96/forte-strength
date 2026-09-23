"use client"

import { cn } from "cn"
import { Loader2Icon } from "lucide-react"
import { AnimatePresence, m } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import type { WeightUnit } from "@/lib/units"

import {
  createExercise,
  discardEmptyExercise,
  loadExerciseSeries,
  type AddEntryOutcome,
} from "../../actions"
import type { AddPrefill } from "../../lib/prefill"
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
  /**
   * Steps 01 and 02 answered in advance, from a link such as a dashboard's empty cell.
   * Applied once on mount; the URL is then rewritten so a refresh doesn't apply it again.
   */
  prefill?: AddPrefill
}

/** The lift step folds open and closed rather than popping in and out. */
const entryVariants = {
  closed: { opacity: 0, height: 0 },
  open: { opacity: 1, height: "auto" },
}

function scrollToStep(element: HTMLElement | null) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  element?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
}

export function AddPanel({
  exercises,
  unit: initialUnit,
  basePath,
  athleteId,
  prefill,
}: AddPanelProps) {
  const router = useRouter()
  const [unit, setUnit] = useState(initialUnit)
  const [exercise, setExercise] = useState<ExerciseSummary | null>(null)
  const [series, setSeries] = useState<SeriesView[]>([])
  const [shape, setShape] = useState<SeriesShape | null>(null)
  const [outcome, setOutcome] = useState<AddEntryOutcome | null>(null)
  const [prefilling, setPrefilling] = useState(Boolean(prefill))
  const prefillApplied = useRef(false)
  const entryRef = useRef<HTMLDivElement>(null)
  const entryWasOpen = useRef(false)

  // Resolve the linked movement the way the picker would: an existing movement is reused,
  // a catalogue name is created, and a near-duplicate falls back to the closest existing
  // one (which is almost always what a link means). Guarded by a ref so it runs exactly
  // once, including under React's development double-invoke.
  useEffect(() => {
    if (!prefill || prefillApplied.current) return
    prefillApplied.current = true

    async function apply(target: AddPrefill) {
      let result = await createExercise({ name: target.movement, athleteId })
      if (!result.ok && result.status === "confirm" && result.suggestions[0]) {
        result = await createExercise({ name: result.suggestions[0].name, athleteId })
      }
      if (result.ok) {
        const loaded = await loadExerciseSeries(result.exercise.slug, athleteId)
        setExercise(result.exercise)
        setSeries(loaded)
        setShape(target.series)
      }
      setPrefilling(false)
      // Consumed: neither a refresh nor Back should set the form up all over again.
      window.history.replaceState(null, "", `${basePath}?panel=add`)
    }
    void apply(prefill)
  }, [prefill, athleteId, basePath])

  // The weight field only exists once a PR type is chosen, so it appears below whatever the
  // lifter was just looking at — often below the fold on a phone. Changing PR type while
  // the step is already open can scroll to it at once: it is at full height. The *first*
  // open is left to the wrapper's `onAnimationComplete` below — until the fold-open ends
  // the page has not grown to include the step, and a scroll aimed at it lands short.
  useEffect(() => {
    const wasOpen = entryWasOpen.current
    entryWasOpen.current = shape !== null
    if (shape && wasOpen) scrollToStep(entryRef.current)
  }, [shape])

  async function pickExercise(picked: ExerciseSummary) {
    setExercise(picked)
    setShape(null)
    setOutcome(null)
    setSeries(await loadExerciseSeries(picked.slug, athleteId))
  }

  function reset(keepExercise: boolean) {
    const logged = outcome?.series
    setOutcome(null)
    setShape(null)

    if (!keepExercise) {
      // Backing out of a movement that never got a record takes the movement with it.
      if (exercise) void discardEmptyExercise({ exerciseId: exercise.id, athleteId })
      setExercise(null)
      setSeries([])
    } else if (logged) {
      // Fold the series we just wrote back into the list. Without this, logging a second
      // record in the same sitting would show the record to beat — and the "log as your
      // baseline" wording — from before the first one, correcting only on a refresh.
      setSeries((current) => {
        const index = current.findIndex((item) => item.id === logged.id)
        if (index === -1) return [...current, logged]
        return current.map((item, at) => (at === index ? logged : item))
      })
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
        ) : prefilling && prefill ? (
          <div
            role="status"
            className="flex items-center gap-3 rounded-xl bg-card p-3.5 text-sm text-muted-foreground ring-1 ring-foreground/10"
          >
            <Loader2Icon className="size-4 animate-spin text-highlight" aria-hidden="true" />
            Setting up {prefill.movement}…
          </div>
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

      {/* Choosing a different PR type takes this step away again, and a step vanishing
          under the viewport snaps the page upward. Collapsing it instead means the scroll
          position settles rather than jumps — quick enough not to be a wait. */}
      <AnimatePresence initial={false}>
        {exercise && shape && (
          <m.div
            key="entry"
            variants={entryVariants}
            initial="closed"
            animate="open"
            exit="closed"
            transition={{ duration: 0.2, ease: "easeOut" }}
            // Fires with the variant's name once every value has settled, height included —
            // the earliest moment a scroll can be aimed at where the step really is.
            onAnimationComplete={(definition) => {
              if (definition === "open") scrollToStep(entryRef.current)
            }}
            // `clip`, not `hidden`: a hidden overflow is still a scroll container, and
            // scrollIntoView would scroll the step around inside a wrapper that is 0px tall.
            className="overflow-clip"
          >
            <Step index="03" title="The lift" done={false} ref={entryRef}>
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
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function Step({
  index,
  title,
  done,
  children,
  ref,
}: {
  index: string
  title: string
  done: boolean
  children: React.ReactNode
  ref?: React.Ref<HTMLDivElement>
}) {
  return (
    <section
      ref={ref}
      className="scroll-mt-24 rounded-2xl bg-card/60 p-4 ring-1 ring-foreground/10 sm:p-5"
    >
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
