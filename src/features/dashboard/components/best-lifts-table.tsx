"use client"

import { ArrowRightIcon, PlusIcon, TrophyIcon } from "lucide-react"
import { m, type Variants } from "motion/react"
import Link from "next/link"

import { AnimatedNumber } from "@/components/motion/animated-number"
import { LightSweep } from "@/components/motion/light-sweep"
import { Button } from "@/components/ui/button"
import {
  BEST_LIFT_REPS,
  COMPETITION_LIFT_LABELS,
  COMPETITION_LIFTS,
  bestLiftAddHref,
  type BestLift,
  type BestLiftReps,
  type BestLifts,
  type CompetitionLift,
} from "@/features/pr-tracker/lib/lifts"
import { fromKg } from "@/features/pr-tracker/lib/weight"
import { formatDay } from "@/lib/day"
import type { WeightUnit } from "@/lib/units"

import { enter, stagger } from "./variants"

const TRACKER_HREF = "/tools/pr-tracker"
const ADD_HREF = "/tools/pr-tracker?panel=add"

const row: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 26 } },
}

const gridClass =
  "grid grid-cols-[2.75rem_repeat(3,minmax(0,1fr))] items-center gap-2 sm:grid-cols-[3.5rem_repeat(3,minmax(0,1fr))] sm:gap-3"

/** S / B / D by 1RM / 2RM / 3RM, numbers counting up as the rows slide in. */
export function BestLiftsTable({ lifts, unit }: { lifts: BestLifts; unit: WeightUnit }) {
  return (
    <m.section
      variants={enter}
      aria-labelledby="best-lifts-heading"
      className="relative min-w-0 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
    >
      {/* A single light sweep across the card once it has landed. */}
      <LightSweep delay={0.6} />

      <div className="flex items-end justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            Personal records
          </p>
          <h2 id="best-lifts-heading" className="font-heading text-2xl font-bold uppercase">
            Your best lifts so far
          </h2>
        </div>
        <Link
          href={TRACKER_HREF}
          className="hidden shrink-0 items-center gap-1 text-sm text-highlight hover:underline sm:inline-flex"
        >
          PR tracker
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>

      {lifts.hasAny ? <LiftGrid lifts={lifts} unit={unit} /> : <NoLiftsYet />}
    </m.section>
  )
}

function LiftGrid({ lifts, unit }: { lifts: BestLifts; unit: WeightUnit }) {
  return (
    <div className="flex flex-col gap-4 p-4 sm:p-6">
      <m.div variants={stagger(0.1, 0.15)} role="table" aria-label="Best lifts">
        <div role="row" className={gridClass}>
          {/* A real grid cell: `sr-only` is absolutely positioned and would drop out of the
              grid, shifting every header one column left. */}
          <span role="columnheader">
            <span className="sr-only">Lift</span>
          </span>
          {BEST_LIFT_REPS.map((reps) => (
            <span
              key={reps}
              role="columnheader"
              className="text-center font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase"
            >
              {reps}RM
            </span>
          ))}
        </div>

        {COMPETITION_LIFTS.map((lift) => (
          <m.div
            key={lift}
            variants={row}
            role="row"
            className={`${gridClass} border-t border-border py-3`}
          >
            <span
              role="rowheader"
              title={COMPETITION_LIFT_LABELS[lift]}
              className="grid size-10 place-items-center rounded-xl bg-primary/15 font-heading text-xl font-bold text-highlight ring-1 ring-primary/30 sm:size-12 sm:text-2xl"
            >
              <span aria-hidden="true">{COMPETITION_LIFT_LABELS[lift][0]}</span>
              <span className="sr-only">{COMPETITION_LIFT_LABELS[lift]}</span>
            </span>
            {BEST_LIFT_REPS.map((reps) => (
              <LiftCell
                key={reps}
                lift={lift}
                reps={reps}
                best={lifts.lifts[lift][reps]}
                movement={trackedMovement(lifts, lift)}
                unit={unit}
              />
            ))}
          </m.div>
        ))}
      </m.div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>Heaviest competition-style squat, bench and deadlift logged in the PR tracker.</p>
        <Link
          href={TRACKER_HREF}
          className="inline-flex items-center gap-1 text-highlight hover:underline sm:hidden"
        >
          Open the PR tracker
          <ArrowRightIcon className="size-3" />
        </Link>
      </div>
    </div>
  )
}

/**
 * A movement already tracked somewhere in this row, so an empty cell continues it
 * rather than starting a plain "Squat" beside their "Back Squat".
 */
function trackedMovement(lifts: BestLifts, lift: CompetitionLift) {
  return BEST_LIFT_REPS.map((reps) => lifts.lifts[lift][reps]).find((best) => best !== null)
    ?.exerciseName
}

function LiftCell({
  lift,
  reps,
  best,
  movement,
  unit,
}: {
  lift: CompetitionLift
  reps: BestLiftReps
  best: BestLift | null
  movement: string | undefined
  unit: WeightUnit
}) {
  const label = COMPETITION_LIFT_LABELS[lift]

  if (!best) {
    return (
      <div role="cell" className="flex justify-center">
        <Link
          // Lands on the Add panel with movement and PR type chosen: only weight and date left.
          href={bestLiftAddHref(lift, reps, movement)}
          aria-label={`Log a ${reps}-rep ${label.toLowerCase()} PR`}
          className="flex h-14 w-full max-w-28 flex-col items-center justify-center gap-0.5 rounded-xl border border-dashed border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-highlight focus-visible:border-primary/40 focus-visible:text-highlight"
        >
          {/* Always visible: on a phone there is no hover to reveal it. */}
          <PlusIcon className="size-4" aria-hidden="true" />
          <span className="text-[10px] font-medium tracking-wider uppercase">Log PR</span>
        </Link>
      </div>
    )
  }

  const value = fromKg(best.weightKg, unit)
  return (
    <div role="cell" className="flex justify-center">
      <Link
        href={best.href}
        title={`${best.exerciseName} · ${formatDay(best.achievedOn)}`}
        className="flex h-14 w-full max-w-28 flex-col items-center justify-center gap-0.5 rounded-xl bg-background/40 ring-1 ring-foreground/10 transition-[background-color,box-shadow] hover:bg-primary/10 hover:ring-primary/40 focus-visible:ring-primary/60"
      >
        <span className="flex items-baseline gap-1">
          <AnimatedNumber
            value={value}
            from={0}
            decimals={Number.isInteger(value) ? 0 : 1}
            className="font-heading text-2xl leading-none font-bold sm:text-3xl"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </span>
        <span className="max-w-full truncate px-1.5 text-[10px] leading-none text-muted-foreground">
          {best.exerciseName}
        </span>
      </Link>
    </div>
  )
}

function NoLiftsYet() {
  return (
    <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
      <span className="grid size-14 place-items-center rounded-full bg-primary/10 text-highlight ring-1 ring-primary/30">
        <TrophyIcon className="size-7" />
      </span>
      <div className="flex flex-col gap-1">
        <p className="font-heading text-xl font-bold uppercase">No lifts logged yet</p>
        <p className="max-w-sm text-sm text-muted-foreground">
          Log your first squat, bench or deadlift in the PR tracker and your 1, 2 and 3 rep maxes
          show up here.
        </p>
      </div>
      <Button asChild size="lg" className="h-11 font-heading tracking-wider uppercase">
        <Link href={ADD_HREF}>
          <PlusIcon />
          Log your first PR
        </Link>
      </Button>
    </div>
  )
}
