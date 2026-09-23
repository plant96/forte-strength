import type { Day } from "@/lib/day"

import { findCatalogEntry } from "../catalog"
import { compactName } from "./slug"

/**
 * The three competition lifts, for the dashboard's "best lifts" table.
 *
 * Only the competition movement itself counts — "Back Squat" is a squat, "Front Squat"
 * is not; "Sumo Deadlift" is a deadlift, "Romanian Deadlift" is not. Names arrive in
 * whatever casing and spacing the lifter typed ("BENCH", "bENCH", "bench-press"), so
 * matching goes through the catalogue's aliases first and a compacted-name fallback second.
 */
export type CompetitionLift = "squat" | "bench" | "deadlift"

export const COMPETITION_LIFTS = [
  "squat",
  "bench",
  "deadlift",
] as const satisfies readonly CompetitionLift[]

export const COMPETITION_LIFT_LABELS: Record<CompetitionLift, string> = {
  squat: "Squat",
  bench: "Bench",
  deadlift: "Deadlift",
}

/** The columns of the best-lifts table: 1, 2 and 3 rep maxes. */
export type BestLiftReps = 1 | 2 | 3

export const BEST_LIFT_REPS = [1, 2, 3] as const satisfies readonly BestLiftReps[]

export interface BestLift {
  weightKg: number
  /** The movement it came from, e.g. "Back Squat" in the squat row. */
  exerciseName: string
  achievedOn: Day
  /** The series page in the PR tracker. */
  href: string
}

export type BestLiftGrid = Record<CompetitionLift, Record<BestLiftReps, BestLift | null>>

export interface BestLifts {
  lifts: BestLiftGrid
  /** False when every cell is empty — the table shows an invitation instead. */
  hasAny: boolean
}

export function emptyBestLifts(): BestLifts {
  return {
    lifts: {
      squat: { 1: null, 2: null, 3: null },
      bench: { 1: null, 2: null, 3: null },
      deadlift: { 1: null, 2: null, 3: null },
    },
    hasAny: false,
  }
}

export function isBestLiftReps(reps: number): reps is BestLiftReps {
  return reps === 1 || reps === 2 || reps === 3
}

/** Catalogue slugs that are the competition lift, not a variation of it. */
const CATALOG_SLUGS: Record<string, CompetitionLift> = {
  squat: "squat",
  "back-squat": "squat",
  "bench-press": "bench",
  deadlift: "deadlift",
  "sumo-deadlift": "deadlift",
}

/** Qualifiers that don't change which lift it is: "comp bench", "low bar squat". */
const NEUTRAL_TOKENS = [
  "competition",
  "comp",
  "barbell",
  "bb",
  "flat",
  "conventional",
  "conv",
  "lowbar",
  "highbar",
  "back",
  "sumo",
]

const NEUTRAL_PATTERN = new RegExp(NEUTRAL_TOKENS.join("|"), "g")

export function classifyCompetitionLift(name: string): CompetitionLift | null {
  const entry = findCatalogEntry(name)
  if (entry) return CATALOG_SLUGS[entry.slug] ?? null

  const compact = compactName(name)
  if (!compact) return null

  const core = compact
    .replace(NEUTRAL_PATTERN, "")
    .replace(/press$/, "")
    .replace(/s$/, "")
  if (core === "squat") return "squat"
  if (core === "bench") return "bench"
  if (core === "deadlift" || core === "dl") return "deadlift"
  return null
}
