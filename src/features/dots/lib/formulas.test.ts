import { describe, expect, it } from "vitest"

import { toDotsInput, type DotsFormValues } from "../schema"
import { calculateDots } from "./dots"
import { buildDotsBreakdown, dotsBreakdownToText, type DotsBreakdown } from "./formulas"
import { calculateRequiredTotal } from "./reverse"

const VALUES: DotsFormValues = {
  weight: 205,
  weightUnit: "lb",
  total: 1543,
  totalUnit: "lb",
  age: 30,
  sex: "male",
}

const result = calculateDots(toDotsInput(VALUES))

function findStep(breakdown: DotsBreakdown, id: string) {
  const step = breakdown.sections.flatMap((section) => section.steps).find((s) => s.id === id)
  if (!step) throw new Error(`Missing step ${id}`)
  return step
}

describe("buildDotsBreakdown", () => {
  const breakdown = buildDotsBreakdown(VALUES, result, null)

  it("echoes the inputs next to the metric values used", () => {
    expect(breakdown.inputs.find((row) => row.label === "Bodyweight")).toMatchObject({
      entered: "205 lb",
      used: "92.99 kg",
      symbol: "BW",
    })
    expect(breakdown.inputs.find((row) => row.label === "Total")).toMatchObject({
      entered: "1,543 lb",
      used: "699.89 kg",
      symbol: "T",
    })
    expect(breakdown.inputs.map((row) => row.label)).not.toContain("Bodyweight for DOTS")
  })

  it("highlights the user's numbers in the substituted formulas", () => {
    expect(findStep(breakdown, "p").substituted.tex).toContain("\\val{92.99}")
    expect(findStep(breakdown, "dots").substituted.tex).toContain("\\val{699.89}")
    expect(findStep(breakdown, "d").substituted.tex).toContain("e^{-0.00921")
  })

  it("writes the polynomial with the sign of each coefficient", () => {
    const { formula } = findStep(breakdown, "p")
    // Two aligned lines: the first two terms, then the rest.
    expect(formula.tex).toBe(
      "\\begin{aligned} P(BW) &= -0.000001093\\,BW^4 + 0.0007391293\\,BW^3 \\\\ &\\quad - 0.1918759221\\,BW^2 + 24.0900756\\,BW - 307.75076 \\end{aligned}",
    )
    expect(formula.text).toBe(
      "P(BW) = −0.000001093·BW⁴ + 0.0007391293·BW³ − 0.1918759221·BW² + 24.0900756·BW − 307.75076",
    )
  })

  it("uses the plain lookup for an open-age lifter", () => {
    const step = findStep(breakdown, "cage")
    expect(step.result).toMatchObject({ symbol: "Cage", value: 1 })
    expect(step.extra).toBe("age-table")
    expect(step.notes).toContain(
      "Your coefficient is 1.000, so your age-adjusted DOTS equals your DOTS.",
    )
    expect(breakdown.sections.map((section) => section.id)).toEqual(["dots", "age", "glp"])
  })

  it("shows the interpolation for a masters lifter between listed ages", () => {
    const masters = { ...VALUES, age: 42 }
    const step = findStep(
      buildDotsBreakdown(masters, calculateDots(toDotsInput(masters)), null),
      "cage",
    )
    expect(step.formula.tex).toContain("C_{\\text{lo}}")
    expect(step.substituted.tex).toContain("\\val{42} - 40")
    expect(step.result?.value).toBeCloseTo(1.0104, 4)
  })

  it("notes when the bodyweight was clamped for DOTS", () => {
    const light = { ...VALUES, weight: 30, weightUnit: "kg" as const }
    const clamped = buildDotsBreakdown(light, calculateDots(toDotsInput(light)), null)
    expect(clamped.inputs.find((row) => row.label === "Bodyweight for DOTS")).toMatchObject({
      used: "40.00 kg",
    })
    expect(findStep(clamped, "p").notes[0]).toMatch(/read as 40\.00 kg/)
    expect(findStep(clamped, "d").notes[0]).toMatch(/uses your 30\.00 kg as entered/)
  })

  it("adds the required-total section only when a target is set", () => {
    const reverse = calculateRequiredTotal({ ...toDotsInput(VALUES), kind: "dots", score: 500 })
    const withReverse = buildDotsBreakdown(VALUES, result, reverse)
    expect(withReverse.sections.at(-1)?.id).toBe("reverse")
    const treq = findStep(withReverse, "treq")
    expect(treq.result?.value).toBeCloseTo(result.dots.denominator, 6)
    expect(treq.notes[0]).toMatch(/^That's [\d,.]+ lb\.$/)
    expect(findStep(withReverse, "tage").result?.symbol).toBe("Tage")
  })

  it("skips the age step and says why for a GLP target", () => {
    const reverse = calculateRequiredTotal({ ...toDotsInput(VALUES), kind: "glp", score: 100 })
    const withReverse = buildDotsBreakdown(VALUES, result, reverse)
    const ids = withReverse.sections.at(-1)?.steps.map((step) => step.id)
    expect(ids).toEqual(["treq"])
    expect(findStep(withReverse, "treq").notes).toContain(
      "GLP has no age coefficient, so this total is the same at any age.",
    )
  })
})

describe("dotsBreakdownToText", () => {
  it("lists inputs, steps and results as plain text", () => {
    const text = dotsBreakdownToText(buildDotsBreakdown(VALUES, result, null))
    expect(text).toContain("/tools/dots-calculator")
    expect(text).toContain("Bodyweight: 205 lb → BW = 92.99 kg")
    expect(text).toContain("STEP 1: DOTS")
    expect(text).toContain("STEP 3: IPF GL POINTS")
    expect(text).toMatch(/DOTS 445\.\d\d · Age-adjusted DOTS 445\.\d\d \(× 1\.000\) · GLP 91\.\d\d/)
    expect(text).not.toContain("\\val")
  })
})
