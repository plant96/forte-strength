"use client"

import { useRef, useState } from "react"

import { Reveal } from "@/components/motion/reveal"
import { sparkleFrom } from "@/features/pr-tracker/components/chart/particles"
import type { WeightUnit } from "@/lib/units"

import type { LeaderboardAthlete } from "../lib/athletes"
import type { LiftFilters as Filters } from "../lib/groups"
import { rankByLift } from "../lib/rankings"
import { LiftFilters } from "./lift-filters"
import { LiftResults } from "./lift-results"
import { UnitToggle } from "./unit-toggle"

interface LiftLeaderboardProps {
  athletes: readonly LeaderboardAthlete[]
  viewerId: string | null
  unavailable: boolean
  unit: WeightUnit
  onUnitChange: (unit: WeightUnit) => void
  initialFilters: Filters
}

/**
 * The generated board: pick a lift, age group and weight class, press Generate, and
 * every athlete who fits is ranked by their best 1RM. After the first generate the board
 * follows the filters live.
 */
export function LiftLeaderboard({
  athletes,
  viewerId,
  unavailable,
  unit,
  onUnitChange,
  initialFilters,
}: LiftLeaderboardProps) {
  const [filters, setFilters] = useState(initialFilters)
  const [applied, setApplied] = useState<Filters | null>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const results = applied ? rankByLift(athletes, applied) : []

  function updateFilters(patch: Partial<Filters>) {
    const next = { ...filters, ...patch }
    setFilters(next)
    if (applied) setApplied(next)
  }

  function generate() {
    setApplied(filters)
    if (rankByLift(athletes, filters).length > 0) void sparkleFrom(buttonRef.current)
  }

  return (
    <Reveal>
      <section
        aria-labelledby="lift-board-heading"
        className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
      >
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
          <div className="flex flex-col gap-1">
            <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
              Generate a board
            </p>
            <h2 id="lift-board-heading" className="font-heading text-2xl font-bold uppercase">
              Best lift by class
            </h2>
          </div>
          <UnitToggle value={unit} onChange={onUnitChange} />
        </div>

        <LiftFilters
          filters={filters}
          onChange={updateFilters}
          onGenerate={generate}
          hasGenerated={applied !== null}
          buttonRef={buttonRef}
        />
        <LiftResults
          applied={applied}
          results={results}
          unit={unit}
          viewerId={viewerId}
          unavailable={unavailable}
        />
      </section>
    </Reveal>
  )
}
