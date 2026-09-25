import { describe, expect, it } from "vitest"

import { emptyBestLifts, type BestLift } from "@/features/pr-tracker/lib/lifts"

import { totalFromBestLifts } from "./best-total"

const lift = (weightKg: number): BestLift => ({
  weightKg,
  exerciseName: "Lift",
  achievedOn: "2026-06-01",
  href: "/tools/pr-tracker/lift/1rm",
})

describe("totalFromBestLifts", () => {
  it("adds the three 1RMs", () => {
    const best = emptyBestLifts()
    best.lifts.squat[1] = lift(250)
    best.lifts.bench[1] = lift(160)
    best.lifts.deadlift[1] = lift(290)
    expect(totalFromBestLifts(best)).toBe(700)
  })

  it("returns null when any lift is missing, even with rep maxes logged", () => {
    const best = emptyBestLifts()
    best.lifts.squat[1] = lift(250)
    best.lifts.bench[2] = lift(150)
    best.lifts.deadlift[1] = lift(290)
    expect(totalFromBestLifts(best)).toBeNull()
    expect(totalFromBestLifts(emptyBestLifts())).toBeNull()
  })
})
