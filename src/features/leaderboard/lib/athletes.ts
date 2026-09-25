import { clampBodyweight, dotsPolynomial, dotsScore } from "@/features/dots/lib/dots"
import { classifyCompetitionLift, type CompetitionLift } from "@/features/pr-tracker/lib/lifts"
import { ageOn, dateToBirthday } from "@/features/profile/lib/birthday"
import { SEX_FROM_DB } from "@/features/profile/mappers"
import type { Sex } from "@/features/tdee/lib/constants"
import { toDay, type Day } from "@/lib/day"
import { lbToKg } from "@/lib/units"

import { ageGroupFor, weightClassFor, type AgeGroupId, type WeightClassId } from "./groups"
import { initialsFor, leaderboardName } from "./name"

export interface AthleteLift {
  kg: number
  achievedOn: Day
}

/**
 * One coaching client as the public boards see them. Plain strings and numbers only, so
 * the whole roster can be handed to the client components that rank and filter it.
 */
export interface LeaderboardAthlete {
  id: string
  /** "Tyler M." */
  name: string
  /** "TM" */
  initials: string
  sex: Sex
  ageYears: number
  /** Null under 14: not in any age group. */
  ageGroupId: AgeGroupId | null
  weightClassId: WeightClassId
  /** Current profile bodyweight, in kg, as entered (DOTS clamps its own copy). */
  bodyweightKg: number
  /** Best 1RM per competition lift. */
  lifts: Partial<Record<CompetitionLift, AthleteLift>>
  /** Squat + bench + deadlift, in kg; null unless all three exist. */
  totalKg: number | null
  /** DOTS with no age coefficient; null when the total is. */
  dots: number | null
}

/** A profile as the leaderboard query selects it. */
export interface LeaderboardProfile {
  birthDate: Date
  sex: "MALE" | "FEMALE"
  weight: number
  weightUnit: "LB" | "KG"
}

/** One client as the leaderboard query returns them. */
export interface LeaderboardRow {
  id: string
  firstName: string | null
  lastName: string | null
  profile: LeaderboardProfile | null
  prSeries: {
    exercise: { name: string }
    entries: { weightKg: number; achievedOn: Date }[]
  }[]
}

export interface AthleteBody {
  sex: Sex
  ageYears: number
  bodyweightKg: number
}

/** The parts of a profile the boards need, in the units the math uses. */
export function profileBody(profile: LeaderboardProfile, today: Date = new Date()): AthleteBody {
  return {
    sex: SEX_FROM_DB[profile.sex],
    ageYears: ageOn(dateToBirthday(profile.birthDate), today),
    bodyweightKg: profile.weightUnit === "KG" ? profile.weight : lbToKg(profile.weight),
  }
}

/** DOTS without an age coefficient, clamping the bodyweight like the calculator does. */
export function dotsFor(bodyweightKg: number, totalKg: number, sex: Sex) {
  return dotsScore(totalKg, dotsPolynomial(clampBodyweight(bodyweightKg, sex).kg, sex))
}

/** Best 1RM per competition lift from a client's series, heaviest wins across name variants. */
function bestLifts(series: LeaderboardRow["prSeries"]) {
  const lifts: Partial<Record<CompetitionLift, AthleteLift>> = {}
  for (const row of series) {
    const best = row.entries[0]
    if (!best) continue
    const lift = classifyCompetitionLift(row.exercise.name)
    if (!lift) continue
    const current = lifts[lift]
    if (current && current.kg >= best.weightKg) continue
    lifts[lift] = { kg: best.weightKg, achievedOn: toDay(best.achievedOn) }
  }
  return lifts
}

/** Clients with a profile become athletes; anyone without one is left out of both boards. */
export function buildAthletes(rows: LeaderboardRow[], today: Date = new Date()) {
  const athletes: LeaderboardAthlete[] = []
  for (const row of rows) {
    if (!row.profile) continue
    const body = profileBody(row.profile, today)
    const lifts = bestLifts(row.prSeries)
    const { squat, bench, deadlift } = lifts
    const totalKg = squat && bench && deadlift ? squat.kg + bench.kg + deadlift.kg : null

    athletes.push({
      id: row.id,
      name: leaderboardName(row.firstName, row.lastName),
      initials: initialsFor(row.firstName, row.lastName),
      sex: body.sex,
      ageYears: body.ageYears,
      ageGroupId: ageGroupFor(body.ageYears),
      weightClassId: weightClassFor(body.bodyweightKg),
      bodyweightKg: body.bodyweightKg,
      lifts,
      totalKg,
      dots: totalKg === null ? null : dotsFor(body.bodyweightKg, totalKg, body.sex),
    })
  }
  return athletes
}
