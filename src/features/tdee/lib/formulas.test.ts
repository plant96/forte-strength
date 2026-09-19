import { describe, expect, it } from "vitest"

import type { TdeeFormValues } from "../schema"
import { toTdeeInput } from "../schema"
import { breakdownToText, buildBreakdown } from "./formulas"
import { calculateGoalTargets } from "./goals"
import { resolveCalorieTarget, type CalorieTarget } from "./macros"
import { calculateTdee } from "./tdee"

const VALUES: TdeeFormValues = {
  weight: 180,
  weightUnit: "lb",
  height: { unit: "ft-in", ft: 5, in: 10 },
  age: 30,
  sex: "male",
  bodyFat: 15,
  steps: 8_000,
  sessions: 4,
  intensity: "moderate",
}

const result = calculateTdee(toTdeeInput(VALUES))
const MAINTENANCE: CalorieTarget = {
  id: "maintenance",
  label: "Maintenance",
  calories: result.tdee,
}

function findStep(breakdown: ReturnType<typeof buildBreakdown>, id: string) {
  const step = breakdown.sections.flatMap((section) => section.steps).find((s) => s.id === id)
  if (!step) throw new Error(`Missing step ${id}`)
  return step
}

describe("buildBreakdown", () => {
  const breakdown = buildBreakdown(VALUES, result, "lb", MAINTENANCE)

  it("echoes the inputs next to the metric values used", () => {
    const weight = breakdown.inputs.find((row) => row.label === "Bodyweight")
    expect(weight).toMatchObject({ entered: "180 lb", used: "81.65 kg", symbol: "W" })
    const height = breakdown.inputs.find((row) => row.label === "Height")
    expect(height).toMatchObject({ entered: "5′ 10″", used: "177.8 cm" })
  })

  it("fills the user's numbers into each formula", () => {
    expect(findStep(breakdown, "hb").substituted.tex).toContain("\\val{81.65}")
    expect(findStep(breakdown, "hb").substituted.tex).toContain("\\val{177.8}")
    expect(findStep(breakdown, "x").substituted.tex).toContain("\\val{8{,}000}")
    expect(findStep(breakdown, "tdee").substituted.tex).toContain("\\val{1{,}839.0}")
    expect(findStep(breakdown, "tdee").substituted.tex).toContain("\\val{1.5458}")
  })

  it("reports the same results the calculator produced", () => {
    expect(findStep(breakdown, "hb").result?.value).toBe(result.bmr.harrisBenedict)
    expect(findStep(breakdown, "bmr").result?.value).toBe(result.bmr.average)
    expect(findStep(breakdown, "m").result?.value).toBe(result.activity.multiplier)
    expect(findStep(breakdown, "tdee").result?.value).toBe(result.tdee)
    expect(breakdown.totals.tdee).toBe(result.tdee)
  })

  it("notes when a cap kicks in", () => {
    const capped = { ...VALUES, steps: 22_000, sessions: 7 }
    const cappedBreakdown = buildBreakdown(
      capped,
      calculateTdee(toTdeeInput(capped)),
      "lb",
      MAINTENANCE,
    )
    expect(findStep(cappedBreakdown, "x").notes[0]).toMatch(/capped at 1/)
    expect(findStep(cappedBreakdown, "q").notes[0]).toMatch(/F counts as 5/)
  })

  it("shows the kg → lb conversion when targets are in kg", () => {
    const kg = buildBreakdown(VALUES, result, "kg", MAINTENANCE)
    expect(findStep(kg, "delta").formula.tex).toContain("DD_{\\text{kg}}")
    expect(kg.targets.cut.map((target) => target.rate)).toEqual([0.1, 0.25, 0.5, 1])
  })

  it("works the macro grams out from the calorie target", () => {
    const step = findStep(breakdown, "macros")
    expect(step.substituted.tex).toContain("\\val{2{,}842.7}")
    expect(step.substituted.text).toContain("Protein: 2,842.7 × 0.275 / 4 = 195.4 g")
    expect(step.substituted.text).toContain("Carbs: 2,842.7 × 0.450 / 4 = 319.8 g")
    expect(step.substituted.text).toContain("Fat: 2,842.7 × 0.275 / 9 = 86.9 g")
    expect(breakdown.macros.diets.map((diet) => diet.split.id)).toEqual([
      "standard",
      "high-protein",
      "high-carb",
    ])
  })

  it("builds the macros from a cut target when one is chosen", () => {
    const goals = calculateGoalTargets(result.tdee, result.bmr.average, "lb")
    const cut = resolveCalorieTarget("cut-1", result.tdee, goals)
    const cutBreakdown = buildBreakdown(VALUES, result, "lb", cut)
    expect(cutBreakdown.macros.target.calories).toBeCloseTo(result.tdee - 250, 9)
    expect(findStep(cutBreakdown, "macros").description).toContain("Cut −0.5 lb/week")
  })
})

describe("breakdownToText", () => {
  it("produces a readable plain-text version", () => {
    const text = breakdownToText(buildBreakdown(VALUES, result, "lb", MAINTENANCE))
    expect(text).toContain("Bodyweight: 180 lb → W = 81.65 kg")
    expect(text).toContain("BMR = 1,839.0 kcal/day")
    expect(text).toContain("TDEE = 2,842.7 kcal/day")
    expect(text).toContain("0.50 lb/week: cut 2,593 kcal/day (−250), bulk 3,093 kcal/day (+250)")
    expect(text).toContain("MACROS (Maintenance, 2,843 kcal/day)")
    expect(text).toContain("Not included: the thermic effect of food (TEF).")
    expect(text).toContain(
      "High carb [Coach Ty's favorite]: protein 178 g (25%), carbs 391 g (55%), fat 63 g (20%)",
    )
  })
})
