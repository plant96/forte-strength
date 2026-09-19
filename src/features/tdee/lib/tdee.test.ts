import { describe, expect, it } from "vitest"

import { ftInToCm, lbToKg } from "@/lib/units"

import { calculateGoalTargets, dailyCalorieDelta } from "./goals"
import { calculateTdee, type TdeeInput } from "./tdee"

/** 180 lb, 5'10", 30 y male at 15% body fat, 8,000 steps, 4 moderate sessions. */
const REFERENCE_INPUT: TdeeInput = {
  weightKg: lbToKg(180),
  heightCm: ftInToCm(5, 10),
  ageYears: 30,
  sex: "male",
  bodyFatPercent: 15,
  stepsPerDay: 8_000,
  sessionsPerWeek: 4,
  intensity: "moderate",
}

describe("calculateTdee", () => {
  const result = calculateTdee(REFERENCE_INPUT)

  it("computes each BMR equation", () => {
    expect(result.bmr.harrisBenedict).toBeCloseTo(1865.1, 1)
    expect(result.bmr.mifflinStJeor).toBeCloseTo(1782.7, 1)
    expect(result.bmr.katchMcArdle).toBeCloseTo(1869.0, 1)
    expect(result.bmr.leanMassKg).toBeCloseTo(69.4, 2)
  })

  it("averages the three equations", () => {
    expect(result.bmr.average).toBeCloseTo(1839.0, 1)
  })

  it("multiplies BMR by the activity multiplier", () => {
    expect(result.activity.multiplier).toBeCloseTo(1.5458, 4)
    expect(result.tdee).toBeCloseTo(2842.7, 1)
  })

  it("uses the female coefficients", () => {
    const female = calculateTdee({ ...REFERENCE_INPUT, sex: "female" })
    expect(female.bmr.mifflinStJeor).toBeCloseTo(result.bmr.mifflinStJeor - 166, 6)
    expect(female.bmr.harrisBenedict).not.toBeCloseTo(result.bmr.harrisBenedict, 0)
  })

  it("treats 0 sessions as no training regardless of the chosen intensity", () => {
    const rest = calculateTdee({ ...REFERENCE_INPUT, sessionsPerWeek: 0, intensity: "very-hard" })
    expect(rest.intensityScore).toBe(0)
    expect(rest.activity.q).toBe(0)
    expect(rest.activity.t).toBe(0)
  })
})

describe("goal targets", () => {
  it.each([
    [0.25, 125],
    [0.5, 250],
    [1, 500],
    [2, 1000],
  ])("%f lb/week → %f kcal/day", (rate, expected) => {
    expect(dailyCalorieDelta(rate, "lb")).toBeCloseTo(expected, 6)
  })

  it.each([
    [0.1, 110.2],
    [0.25, 275.6],
    [0.5, 551.2],
    [1, 1102.3],
  ])("%f kg/week → %f kcal/day", (rate, expected) => {
    expect(dailyCalorieDelta(rate, "kg")).toBeCloseTo(expected, 1)
  })

  it("adds for a bulk and subtracts for a cut", () => {
    const { bulk, cut } = calculateGoalTargets(2500, 1800, "lb")
    expect(bulk.map((target) => target.calories)).toEqual([2625, 2750, 3000, 3500])
    expect(cut.map((target) => target.calories)).toEqual([2375, 2250, 2000, 1500])
  })

  it("flags cut targets below BMR", () => {
    const { cut } = calculateGoalTargets(2500, 1800, "lb")
    expect(cut.map((target) => target.belowBmr)).toEqual([false, false, false, true])
  })
})
