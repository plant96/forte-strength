"use client"

import { ArrowRightIcon, PlusIcon, SparklesIcon, TrophyIcon } from "lucide-react"
import { m } from "motion/react"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { AnimatedNumber } from "@/components/motion/animated-number"
import { Button } from "@/components/ui/button"
import type { WeightUnit } from "@/lib/units"

import type { AddEntryOutcome } from "../../actions"
import { formatDay } from "@/lib/day"
import { seriesTitle } from "../../lib/series"
import { formatWeightValue, fromKg } from "../../lib/weight"
import { PrChart } from "../chart/pr-chart"
import { StatRow } from "../stat-row"

/**
 * What a new record looks like the moment it lands.
 *
 * The chart replays the line exactly as it was, then grows to fit the new point; this
 * panel's copy and delta chip arrive with it. There are three tones, because the three
 * ways a record can land mean different things: a first entry is a baseline, a record at
 * the end of the line is a win over your last one, and one slotted into the past fills in
 * history rather than beating anything.
 */

export function Celebration({
  outcome,
  unit,
  basePath,
  onLogAnother,
}: {
  outcome: AddEntryOutcome
  unit: WeightUnit
  /** "/tools/pr-tracker" for the lifter, or the admin's equivalent. */
  basePath: string
  onLogAnother: () => void
}) {
  const [settled, setSettled] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  // The three-step form this replaces was taller than this card, so the moment it swaps in
  // the browser clamps the scroll to the new page bottom — often with the chart's top edge
  // above the viewport as it starts to draw. Bring the card up during the chart's opening
  // hold, so the growth, the draw and the burst all happen on screen.
  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const frame = requestAnimationFrame(() => {
      cardRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [])

  const entry = outcome.series.entries.find((item) => item.id === outcome.entryId)
  const gainKg = outcome.previousKg !== null && entry ? entry.weightKg - outcome.previousKg : null
  const title = seriesTitle(outcome.exercise.name, outcome.series)

  const headline =
    outcome.placement === "first"
      ? "Baseline set"
      : outcome.placement === "backfill"
        ? "Slotted into your history"
        : "New personal record"

  const blurb =
    outcome.placement === "first"
      ? "First entry logged. Beat it and the line starts climbing."
      : outcome.placement === "backfill"
        ? "Your line re-routes through it and keeps climbing."
        : outcome.sameDay
          ? "Twice in one session — the line steps straight up."
          : "That is the heaviest you have ever moved here."

  return (
    <m.div
      ref={cardRef}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 26 }}
      className="flex scroll-mt-24 flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-primary/30 sm:p-6"
    >
      <StatRow className="items-start gap-x-6 gap-y-2">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-highlight">
            {outcome.placement === "first" ? (
              <SparklesIcon className="size-5" />
            ) : (
              <TrophyIcon className="size-5" />
            )}
          </span>
          <div>
            <h2 className="font-heading text-xl font-bold tracking-tight uppercase">{headline}</h2>
            <p className="text-sm text-muted-foreground">{title}</p>
          </div>
        </div>

        {/* Beside the headline while the number fits there, below it only when it does not. */}
        {entry && (
          <div className="flex-1 text-right group-data-[stacked=true]:text-left">
            <p className="font-heading text-3xl font-bold whitespace-nowrap tabular-nums">
              {settled ? (
                // Counts up from the record it beat, so the gain is felt rather than read.
                <AnimatedNumber
                  value={fromKg(entry.weightKg, unit)}
                  from={outcome.previousKg !== null ? fromKg(outcome.previousKg, unit) : undefined}
                  decimals={Number.isInteger(fromKg(entry.weightKg, unit)) ? 0 : 1}
                />
              ) : (
                formatWeightValue(entry.weightKg, unit)
              )}
              <span className="ml-1 text-base font-medium text-muted-foreground">{unit}</span>
            </p>
            {gainKg !== null && gainKg > 0 && settled && (
              <m.p
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 380, damping: 18 }}
                className="text-sm font-medium text-chart-4"
              >
                +{formatWeightValue(gainKg, unit)} {unit} on your last
              </m.p>
            )}
          </div>
        )}
      </StatRow>

      <PrChart
        entries={outcome.series.entries}
        unit={unit}
        celebrate={{ entryId: outcome.entryId, placement: outcome.placement }}
        onCelebrationEnd={() => setSettled(true)}
        height={300}
        label={`${title}: ${outcome.series.entries.length} records`}
      />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {blurb}
          {entry && <> Logged for {formatDay(entry.achievedOn)}.</>}
        </p>
        <div className="flex gap-2">
          {/* With a single record there is nothing else to go and see — it is on the graph
              right above this, and they just put it there. */}
          {outcome.series.entries.length > 1 && (
            <Button variant="outline" className="h-10" asChild>
              <Link href={`${basePath}/${outcome.exercise.slug}/${outcome.series.key}`}>
                See every record
                <ArrowRightIcon />
              </Link>
            </Button>
          )}
          <Button className="h-10" onClick={onLogAnother}>
            <PlusIcon />
            Log another
          </Button>
        </div>
      </div>
    </m.div>
  )
}
