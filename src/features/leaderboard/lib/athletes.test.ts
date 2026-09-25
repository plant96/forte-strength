import { describe, expect, it } from "vitest"

import { calculateDots } from "@/features/dots/lib/dots"
import { KG_PER_LB } from "@/lib/units"

import { buildAthletes, dotsFor, profileBody, type LeaderboardRow } from "./athletes"

const TODAY = new Date(2026, 8, 25)

type Series = LeaderboardRow["prSeries"][number]

const series = (name: string, weightKg: number | null, day = "2026-08-12"): Series => ({
  exercise: { name },
  entries: weightKg === null ? [] : [{ weightKg, achievedOn: new Date(`${day}T00:00:00Z`) }],
})

const row = (overrides: Partial<LeaderboardRow> = {}): LeaderboardRow => ({
  id: "u-1",
  firstName: "Marcus",
  lastName: "Reyes",
  profile: {
    birthDate: new Date("1998-03-10T00:00:00Z"),
    sex: "MALE",
    weight: 93,
    weightUnit: "KG",
  },
  prSeries: [series("Squat", 250), series("Bench Press", 150), series("Deadlift", 300)],
  ...overrides,
})

describe("profileBody", () => {
  it("converts a pound profile to kilograms and works out today's age", () => {
    expect(
      profileBody(
        {
          birthDate: new Date("1986-09-25T00:00:00Z"),
          sex: "FEMALE",
          weight: 150,
          weightUnit: "LB",
        },
        TODAY,
      ),
    ).toEqual({ sex: "female", ageYears: 40, bodyweightKg: 150 * KG_PER_LB })
  })

  it("is still 39 the day before the birthday", () => {
    const body = profileBody(
      { birthDate: new Date("1986-09-26T00:00:00Z"), sex: "MALE", weight: 80, weightUnit: "KG" },
      TODAY,
    )
    expect(body.ageYears).toBe(39)
  })
})

describe("dotsFor", () => {
  it("matches the calculator with no age coefficient", () => {
    const reference = calculateDots({ bodyweightKg: 93, totalKg: 700, ageYears: 30, sex: "male" })
    expect(dotsFor(93, 700, "male")).toBeCloseTo(reference.dots.score, 10)
    expect(dotsFor(93, 700, "male")).toBeCloseTo(445.38, 2)
  })

  it("clamps the bodyweight like the calculator", () => {
    expect(dotsFor(30, 200, "male")).toBeCloseTo(dotsFor(40, 200, "male"), 10)
  })
})

describe("buildAthletes", () => {
  it("turns a client into an athlete with a total and DOTS", () => {
    const [athlete] = buildAthletes([row()], TODAY)
    expect(athlete).toMatchObject({
      id: "u-1",
      name: "Marcus R.",
      initials: "MR",
      sex: "male",
      ageYears: 28,
      ageGroupId: "open",
      weightClassId: "93",
      bodyweightKg: 93,
      totalKg: 700,
    })
    expect(athlete?.lifts).toEqual({
      squat: { kg: 250, achievedOn: "2026-08-12" },
      bench: { kg: 150, achievedOn: "2026-08-12" },
      deadlift: { kg: 300, achievedOn: "2026-08-12" },
    })
    expect(athlete?.dots).toBeCloseTo(445.38, 2)
  })

  it("leaves out clients without a profile", () => {
    expect(buildAthletes([row({ profile: null })], TODAY)).toEqual([])
  })

  it("keeps the heaviest squat across name variants and ignores accessory lifts", () => {
    const [athlete] = buildAthletes(
      [
        row({
          prSeries: [
            series("Squat", 240, "2026-05-01"),
            series("Back Squat", 255, "2026-07-20"),
            series("Front Squat", 300),
            series("Romanian Deadlift", 320),
            series("Bench Press", 150),
            series("Sumo Deadlift", 280),
            series("Deadlift", null),
          ],
        }),
      ],
      TODAY,
    )
    expect(athlete?.lifts.squat).toEqual({ kg: 255, achievedOn: "2026-07-20" })
    expect(athlete?.lifts.deadlift).toEqual({ kg: 280, achievedOn: "2026-08-12" })
    expect(athlete?.totalKg).toBe(685)
  })

  it("has no total or DOTS until all three lifts exist", () => {
    const [athlete] = buildAthletes(
      [row({ prSeries: [series("Squat", 250), series("Deadlift", 300)] })],
      TODAY,
    )
    expect(athlete?.totalKg).toBeNull()
    expect(athlete?.dots).toBeNull()
    expect(athlete?.lifts.bench).toBeUndefined()
  })

  it("puts a 13-year-old in no age group but still scores them", () => {
    const [athlete] = buildAthletes(
      [
        row({
          profile: {
            birthDate: new Date("2013-01-15T00:00:00Z"),
            sex: "FEMALE",
            weight: 45,
            weightUnit: "KG",
          },
        }),
      ],
      TODAY,
    )
    expect(athlete?.ageYears).toBe(13)
    expect(athlete?.ageGroupId).toBeNull()
    expect(athlete?.dots).not.toBeNull()
  })
})
