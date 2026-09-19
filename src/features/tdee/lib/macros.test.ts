import { describe, expect, it } from "vitest"

import { calculateGoalTargets } from "./goals"
import {
  calculateMacros,
  MACRO_SPLITS,
  MACROS,
  resolveCalorieTarget,
  type MacroSplit,
} from "./macros"

const split = (id: MacroSplit["id"]) => {
  const found = MACRO_SPLITS.find((candidate) => candidate.id === id)
  if (!found) throw new Error(`Missing split ${id}`)
  return found
}

describe("macro splits", () => {
  it.each(MACRO_SPLITS.map((s) => [s.name, s] as const))("%s adds up to 100%%", (_, s) => {
    expect(MACROS.reduce((sum, macro) => sum + s.percent[macro], 0)).toBe(100)
  })

  it("matches the specified percentages", () => {
    expect(split("standard").percent).toEqual({ protein: 27.5, carbs: 45, fat: 27.5 })
    expect(split("high-protein").percent).toEqual({ protein: 37.5, carbs: 42.5, fat: 20 })
    expect(split("high-carb").percent).toEqual({ protein: 25, carbs: 55, fat: 20 })
  })

  it("marks only the high-carb split as Coach Ty's favorite", () => {
    expect(MACRO_SPLITS.filter((s) => s.coachFavorite).map((s) => s.id)).toEqual(["high-carb"])
  })
})

describe("calculateMacros", () => {
  it("converts calories to grams at 4/4/9 kcal per gram", () => {
    const [protein, carbs, fat] = calculateMacros(2000, split("standard"))
    expect(protein).toMatchObject({ macro: "protein", kcal: 550, grams: 137.5 })
    expect(carbs).toMatchObject({ macro: "carbs", kcal: 900, grams: 225 })
    expect(fat?.kcal).toBe(550)
    expect(fat?.grams).toBeCloseTo(61.11, 2)
  })

  it("accounts for every calorie", () => {
    for (const s of MACRO_SPLITS) {
      const total = calculateMacros(2842.7, s).reduce((sum, amount) => sum + amount.kcal, 0)
      expect(total).toBeCloseTo(2842.7, 9)
    }
  })
})

describe("resolveCalorieTarget", () => {
  const goals = calculateGoalTargets(2500, 1800, "lb")

  it("defaults to maintenance", () => {
    expect(resolveCalorieTarget("maintenance", 2500, goals)).toMatchObject({
      label: "Maintenance",
      calories: 2500,
    })
  })

  it("finds bulk and cut targets by index", () => {
    expect(resolveCalorieTarget("cut-1", 2500, goals)).toMatchObject({
      label: "Cut −0.5 lb/week",
      calories: 2250,
    })
    expect(resolveCalorieTarget("bulk-3", 2500, goals)).toMatchObject({
      label: "Bulk +2 lb/week",
      calories: 3500,
    })
  })

  it("falls back to maintenance for unknown ids", () => {
    expect(resolveCalorieTarget("cut-9", 2500, goals).id).toBe("maintenance")
  })
})
