import type { CompetitionLift } from "@/features/pr-tracker/lib/lifts"
import type { Sex } from "@/features/tdee/lib/constants"

import { dotsFor, type AthleteLift, type LeaderboardAthlete } from "./athletes"
import { ageGroupFor, weightClassFor } from "./groups"
import { initialsFor, leaderboardName } from "./name"

interface Seed {
  id: string
  first: string
  last: string
  sex: Sex
  age: number
  bw: number
  squat?: number
  bench?: number
  deadlift?: number
}

function lift(kg: number | undefined, achievedOn: string): AthleteLift | undefined {
  return kg === undefined ? undefined : { kg, achievedOn }
}

/** A sample athlete built with the real helpers, so fixtures can never drift from the math. */
export function sampleAthlete(seed: Seed): LeaderboardAthlete {
  const lifts: Partial<Record<CompetitionLift, AthleteLift>> = {}
  const squat = lift(seed.squat, "2026-08-02")
  const bench = lift(seed.bench, "2026-08-16")
  const deadlift = lift(seed.deadlift, "2026-09-06")
  if (squat) lifts.squat = squat
  if (bench) lifts.bench = bench
  if (deadlift) lifts.deadlift = deadlift
  const totalKg = squat && bench && deadlift ? squat.kg + bench.kg + deadlift.kg : null

  return {
    id: seed.id,
    name: leaderboardName(seed.first, seed.last),
    initials: initialsFor(seed.first, seed.last),
    sex: seed.sex,
    ageYears: seed.age,
    ageGroupId: ageGroupFor(seed.age),
    weightClassId: weightClassFor(seed.bw),
    bodyweightKg: seed.bw,
    lifts,
    totalKg,
    dots: totalKg === null ? null : dotsFor(seed.bw, totalKg, seed.sex),
  }
}

/**
 * A roster that exercises every corner of the boards: each age group, most weight classes,
 * a 13-year-old (no group), a lifter with no bench (no DOTS), and a tied squat decided by
 * bodyweight. Thirteen athletes qualify for DOTS, so three sit outside the top 10.
 */
const SEEDS: Seed[] = [
  {
    id: "a-marcus",
    first: "Marcus",
    last: "Reyes",
    sex: "male",
    age: 28,
    bw: 92,
    squat: 250,
    bench: 165,
    deadlift: 300,
  },
  {
    id: "a-jordan",
    first: "Jordan",
    last: "Okafor",
    sex: "male",
    age: 31,
    bw: 82.5,
    squat: 230,
    bench: 150,
    deadlift: 280,
  },
  {
    id: "a-elena",
    first: "Elena",
    last: "Vasquez",
    sex: "female",
    age: 26,
    bw: 63,
    squat: 150,
    bench: 85,
    deadlift: 180,
  },
  {
    id: "a-priya",
    first: "Priya",
    last: "Natarajan",
    sex: "female",
    age: 34,
    bw: 57,
    squat: 130,
    bench: 70,
    deadlift: 160,
  },
  {
    id: "a-tyler",
    first: "Tyler",
    last: "Brooks",
    sex: "male",
    age: 22,
    bw: 74,
    squat: 200,
    bench: 130,
    deadlift: 240,
  },
  {
    id: "a-sam",
    first: "Sam",
    last: "Whitfield",
    sex: "male",
    age: 45,
    bw: 105,
    squat: 240,
    bench: 170,
    deadlift: 270,
  },
  {
    id: "a-ava",
    first: "Ava",
    last: "Lindqvist",
    sex: "female",
    age: 17,
    bw: 52,
    squat: 95,
    bench: 50,
    deadlift: 120,
  },
  {
    id: "a-noah",
    first: "Noah",
    last: "Petrov",
    sex: "male",
    age: 15,
    bw: 66,
    squat: 120,
    bench: 75,
    deadlift: 150,
  },
  {
    id: "a-leo",
    first: "Leo",
    last: "Hamada",
    sex: "male",
    age: 19,
    bw: 83,
    squat: 190,
    bench: 120,
    deadlift: 230,
  },
  {
    id: "a-dana",
    first: "Dana",
    last: "Kowalski",
    sex: "female",
    age: 41,
    bw: 75,
    squat: 140,
    bench: 80,
    deadlift: 170,
  },
  {
    id: "a-chris",
    first: "Chris",
    last: "Abara",
    sex: "male",
    age: 29,
    bw: 118,
    squat: 260,
    bench: 180,
    deadlift: 290,
  },
  {
    id: "a-ben",
    first: "Ben",
    last: "Ortiz",
    sex: "male",
    age: 24,
    bw: 82,
    squat: 230,
    deadlift: 260,
  },
  {
    id: "a-mia",
    first: "Mia",
    last: "Chen",
    sex: "female",
    age: 13,
    bw: 45,
    squat: 60,
    bench: 35,
    deadlift: 80,
  },
  {
    id: "a-omar",
    first: "Omar",
    last: "Haddad",
    sex: "male",
    age: 36,
    bw: 83,
    squat: 210,
    bench: 140,
    deadlift: 250,
  },
]

export const SAMPLE_ATHLETES: readonly LeaderboardAthlete[] = SEEDS.map(sampleAthlete)

/** Ava: a teen with the lowest DOTS on the roster, so "you're #N" shows below the top 10. */
export const SAMPLE_VIEWER_ID = "a-ava"
