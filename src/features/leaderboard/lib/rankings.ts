import type { Day } from "@/lib/day"

import type { LeaderboardAthlete } from "./athletes"
import type { LiftFilters } from "./groups"

export interface DotsRanking {
  rank: number
  athlete: LeaderboardAthlete
  dots: number
  totalKg: number
}

export interface LiftRanking {
  rank: number
  athlete: LeaderboardAthlete
  kg: number
  achievedOn: Day
}

const byName = (a: LeaderboardAthlete, b: LeaderboardAthlete) => a.name.localeCompare(b.name, "en")

function qualifiedForDots(athletes: readonly LeaderboardAthlete[]) {
  return athletes.flatMap((athlete) =>
    athlete.dots !== null && athlete.totalKg !== null
      ? [{ athlete, dots: athlete.dots, totalKg: athlete.totalKg }]
      : [],
  )
}

/**
 * Athletes with all three lifts, best DOTS first. Ties go to the heavier total, then to the
 * name, so ranks are always 1..n with nobody sharing a place.
 */
export function rankByDots(athletes: readonly LeaderboardAthlete[], limit = 10): DotsRanking[] {
  return qualifiedForDots(athletes)
    .sort((a, b) => b.dots - a.dots || b.totalKg - a.totalKg || byName(a.athlete, b.athlete))
    .slice(0, limit)
    .map((entry, index) => ({ rank: index + 1, ...entry }))
}

/**
 * Everyone in the age group and weight class with a 1RM on the lift, heaviest first. Ties go
 * to the lighter lifter (the platform rule), then the earlier date, then the name.
 */
export function rankByLift(
  athletes: readonly LeaderboardAthlete[],
  filters: LiftFilters,
): LiftRanking[] {
  return athletes
    .flatMap((athlete) => {
      const lift = athlete.lifts[filters.lift]
      const matches =
        lift &&
        athlete.ageGroupId === filters.ageGroup &&
        athlete.weightClassId === filters.weightClass
      return matches ? [{ athlete, kg: lift.kg, achievedOn: lift.achievedOn }] : []
    })
    .sort(
      (a, b) =>
        b.kg - a.kg ||
        a.athlete.bodyweightKg - b.athlete.bodyweightKg ||
        a.achievedOn.localeCompare(b.achievedOn) ||
        byName(a.athlete, b.athlete),
    )
    .map((entry, index) => ({ rank: index + 1, ...entry }))
}

/** The viewer's place in the full DOTS order (not just the top 10), or null. */
export function viewerDotsPosition(
  athletes: readonly LeaderboardAthlete[],
  viewerId: string | null,
): DotsRanking | null {
  if (!viewerId) return null
  return rankByDots(athletes, Infinity).find((entry) => entry.athlete.id === viewerId) ?? null
}
