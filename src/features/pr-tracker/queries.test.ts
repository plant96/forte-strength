import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }))

vi.mock("@/server/db", () => ({ db: { prSeries: { findMany: mocks.findMany } } }))

import { getBestLifts } from "./queries"

type Row = {
  kind: "ONE_REP_MAX" | "REP"
  sets: number
  reps: number
  exercise: { name: string; slug: string }
  entries: { weightKg: number; achievedOn: Date }[]
}

const row = (
  name: string,
  kind: Row["kind"],
  reps: number,
  weightKg: number | null,
  day = "2026-08-12",
): Row => ({
  kind,
  sets: 1,
  reps,
  exercise: { name, slug: name.toLowerCase().replace(/\s+/g, "-") },
  entries: weightKg === null ? [] : [{ weightKg, achievedOn: new Date(`${day}T00:00:00Z`) }],
})

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getBestLifts", () => {
  it("returns an empty grid when nothing qualifies", async () => {
    mocks.findMany.mockResolvedValue([
      row("Front Squat", "ONE_REP_MAX", 1, 150),
      row("Overhead Press", "ONE_REP_MAX", 1, 80),
      row("Squat", "ONE_REP_MAX", 1, null),
    ])
    const result = await getBestLifts("user-1")
    expect(result.hasAny).toBe(false)
    expect(result.lifts.squat[1]).toBeNull()
  })

  it("keeps the heaviest per lift and rep count, across name variants", async () => {
    mocks.findMany.mockResolvedValue([
      row("Squat", "ONE_REP_MAX", 1, 180, "2026-06-01"),
      row("Back Squat", "ONE_REP_MAX", 1, 200, "2026-08-12"),
      row("Front Squat", "ONE_REP_MAX", 1, 250),
      row("BENCH", "REP", 2, 132.5, "2026-08-20"),
      row("bench press", "REP", 2, 130),
      row("Deadlift", "REP", 3, 230, "2026-08-01"),
      row("Romanian Deadlift", "REP", 3, 300),
    ])

    const result = await getBestLifts("user-1")
    expect(result.hasAny).toBe(true)
    expect(result.lifts.squat[1]).toEqual({
      weightKg: 200,
      exerciseName: "Back Squat",
      achievedOn: "2026-08-12",
      href: "/tools/pr-tracker/back-squat/1rm",
    })
    expect(result.lifts.squat[2]).toBeNull()
    expect(result.lifts.bench[2]).toEqual(
      expect.objectContaining({
        weightKg: 132.5,
        exerciseName: "BENCH",
        href: "/tools/pr-tracker/bench/2rep",
      }),
    )
    expect(result.lifts.deadlift[3]).toEqual(
      expect.objectContaining({ weightKg: 230, exerciseName: "Deadlift" }),
    )
    expect(result.lifts.deadlift[1]).toBeNull()
  })

  it("asks only for 1RM and 2/3-rep series of this user", async () => {
    mocks.findMany.mockResolvedValue([])
    await getBestLifts("user-7")
    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          userId: "user-7",
          OR: [{ kind: "ONE_REP_MAX" }, { kind: "REP", sets: 1, reps: { in: [2, 3] } }],
        },
      }),
    )
  })
})
