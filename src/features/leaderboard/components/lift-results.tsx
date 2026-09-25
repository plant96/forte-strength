"use client"

import { cn } from "cn"
import { ListOrderedIcon, TrophyIcon, UsersIcon } from "lucide-react"
import { AnimatePresence, m } from "motion/react"

import { AnimatedNumber } from "@/components/motion/animated-number"
import { Badge } from "@/components/ui/badge"
import { COMPETITION_LIFT_LABELS } from "@/features/pr-tracker/lib/lifts"
import { fromKg } from "@/features/pr-tracker/lib/weight"
import { formatDay } from "@/lib/day"
import type { WeightUnit } from "@/lib/units"

import {
  ageGroupLabel,
  ageGroupShort,
  filtersKey,
  weightClassLabel,
  type LiftFilters,
} from "../lib/groups"
import type { LiftRanking } from "../lib/rankings"
import { BoardEmptyState } from "./board-empty-state"
import { InitialsTile } from "./initials-tile"
import { RankBadge } from "./rank-badge"
import { bar, list, row } from "./variants"
import { YouBadge } from "./you-badge"

interface LiftResultsProps {
  /** The filters the board was generated with; null before the first generate. */
  applied: LiftFilters | null
  results: LiftRanking[]
  unit: WeightUnit
  viewerId: string | null
  unavailable: boolean
}

/**
 * The generated board. Keyed by the filter combination, so a change slides the old rows
 * out and staggers the new ones in; a unit change keeps the rows and springs the numbers.
 */
export function LiftResults({ applied, results, unit, viewerId, unavailable }: LiftResultsProps) {
  return (
    <div className="border-t border-border p-5 sm:p-6">
      <AnimatePresence mode="wait" initial={false}>
        {applied === null ? (
          <m.div key="placeholder" variants={row} initial="hidden" animate="show" exit="exit">
            <BoardEmptyState icon={ListOrderedIcon} title="Your board will appear here">
              Pick a lift, an age group and a weight class, then generate.
            </BoardEmptyState>
          </m.div>
        ) : (
          <m.div
            key={filtersKey(applied)}
            variants={list(0.06)}
            initial="hidden"
            animate="show"
            exit="exit"
            className="flex flex-col gap-4"
          >
            <m.div variants={row} className="flex flex-wrap items-center gap-1.5">
              <Badge variant="outline">{COMPETITION_LIFT_LABELS[applied.lift]}</Badge>
              <Badge variant="outline">{ageGroupShort(applied.ageGroup)}</Badge>
              <Badge variant="outline">{weightClassLabel(applied.weightClass)}</Badge>
              <Badge variant="outline" className="border-primary/40 text-highlight">
                <UsersIcon aria-hidden="true" />
                {results.length} {results.length === 1 ? "lifter" : "lifters"}
              </Badge>
            </m.div>

            {results.length === 0 ? (
              <m.div variants={row}>
                <LiftEmpty applied={applied} unavailable={unavailable} />
              </m.div>
            ) : (
              <ol aria-label="Ranked lifters" className="flex flex-col gap-2">
                {results.map((entry) => (
                  <LiftRow
                    key={entry.athlete.id}
                    entry={entry}
                    leaderKg={results[0]!.kg}
                    unit={unit}
                    isYou={entry.athlete.id === viewerId}
                  />
                ))}
              </ol>
            )}
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface LiftRowProps {
  entry: LiftRanking
  leaderKg: number
  unit: WeightUnit
  isYou: boolean
}

function LiftRow({ entry, leaderKg, unit, isYou }: LiftRowProps) {
  const value = fromKg(entry.kg, unit)

  return (
    <m.li
      variants={row}
      className={cn(
        "flex flex-col gap-2 rounded-xl px-3 py-2.5 ring-1",
        isYou ? "bg-primary/5 ring-primary/30" : "bg-background/40 ring-foreground/10",
      )}
    >
      <div className="grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3">
        <RankBadge rank={entry.rank} />
        <InitialsTile initials={entry.athlete.initials} />
        <div className="flex min-w-0 flex-col">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium">{entry.athlete.name}</span>
            {isYou && <YouBadge />}
          </span>
          <span className="text-xs text-muted-foreground">{formatDay(entry.achievedOn)}</span>
        </div>
        <span className="flex items-baseline gap-1">
          <AnimatedNumber
            value={value}
            decimals={Number.isInteger(value) ? 0 : 1}
            from={0}
            className="font-heading text-2xl leading-none font-bold"
          />
          <span className="text-xs text-muted-foreground">{unit}</span>
        </span>
      </div>
      <div aria-hidden="true" className="h-1.5 overflow-hidden rounded-full bg-foreground/5">
        <m.div
          variants={bar}
          className="h-full origin-left rounded-full bg-linear-to-r from-primary to-highlight"
          style={{ width: `${(entry.kg / leaderKg) * 100}%` }}
        />
      </div>
    </m.li>
  )
}

function LiftEmpty({ applied, unavailable }: { applied: LiftFilters; unavailable: boolean }) {
  if (unavailable) {
    return (
      <BoardEmptyState icon={TrophyIcon} title="Leaderboard unavailable">
        Couldn&apos;t reach the PR tracker just now. Try again in a moment.
      </BoardEmptyState>
    )
  }

  return (
    <BoardEmptyState icon={TrophyIcon} title="No lifters in this class yet">
      Nobody on the team has a {COMPETITION_LIFT_LABELS[applied.lift].toLowerCase()} 1RM logged in{" "}
      {ageGroupLabel(applied.ageGroup)}, {weightClassLabel(applied.weightClass)}.
    </BoardEmptyState>
  )
}
