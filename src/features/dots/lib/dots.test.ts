import { describe, expect, it } from "vitest"

import { calculateDots, clampBodyweight, dotsPolynomial, dotsScore } from "./dots"
import { glpDenominator } from "./glp"

describe("calculateDots", () => {
  it("scores a 93 kg man with a 700 kg total", () => {
    const result = calculateDots({ bodyweightKg: 93, totalKg: 700, ageYears: 30, sex: "male" })

    expect(result.dots.denominator).toBeCloseTo(785.8532, 4)
    expect(result.dots.score).toBeCloseTo(445.38, 2)
    expect(result.glp.denominator).toBeCloseTo(764.4024, 4)
    expect(result.glp.score).toBeCloseTo(91.57, 2)
    expect(result.age.coefficient).toBe(1)
    expect(result.age.adjustedScore).toBeCloseTo(result.dots.score, 10)
    expect(result.bodyweight).toEqual({ kg: 93, clamped: false, range: { min: 40, max: 210 } })
  })

  it("scores a 63 kg woman with a 400 kg total", () => {
    const result = calculateDots({ bodyweightKg: 63, totalKg: 400, ageYears: 25, sex: "female" })

    expect(result.dots.score).toBeCloseTo(430.21, 2)
    expect(result.glp.score).toBeCloseTo(87.51, 2)
  })

  it("applies the age coefficient to the adjusted score only", () => {
    const result = calculateDots({ bodyweightKg: 93, totalKg: 700, ageYears: 50, sex: "male" })

    expect(result.age.coefficient).toBe(1.066)
    expect(result.age.adjustedScore).toBeCloseTo(result.dots.score * 1.066, 8)
    expect(result.glp.score).toBeCloseTo(91.57, 2)
  })

  it("clamps the bodyweight for DOTS but not for GLP", () => {
    const light = calculateDots({ bodyweightKg: 30, totalKg: 200, ageYears: 30, sex: "male" })
    expect(light.bodyweight).toEqual({ kg: 40, clamped: true, range: { min: 40, max: 210 } })
    expect(light.dots.denominator).toBeCloseTo(dotsPolynomial(40, "male"), 10)
    expect(light.glp.denominator).toBeCloseTo(glpDenominator(30, "male"), 10)

    const heavy = calculateDots({ bodyweightKg: 160, totalKg: 500, ageYears: 30, sex: "female" })
    expect(heavy.bodyweight).toEqual({ kg: 150, clamped: true, range: { min: 40, max: 150 } })
  })

  it("uses a different curve per sex", () => {
    expect(dotsPolynomial(80, "male")).not.toBeCloseTo(dotsPolynomial(80, "female"), 0)
    expect(glpDenominator(80, "male")).toBeGreaterThan(glpDenominator(80, "female"))
  })

  it("keeps the reference total positive across the whole range", () => {
    for (const bw of [40, 60, 100, 150, 210]) expect(dotsPolynomial(bw, "male")).toBeGreaterThan(0)
    for (const bw of [40, 60, 100, 150]) expect(dotsPolynomial(bw, "female")).toBeGreaterThan(0)
  })

  it("scores exactly 500 when the total equals the reference", () => {
    const reference = dotsPolynomial(93, "male")
    expect(dotsScore(reference, reference)).toBe(500)
  })
})

describe("clampBodyweight", () => {
  it("leaves in-range weights alone", () => {
    expect(clampBodyweight(75.5, "female")).toEqual({
      kg: 75.5,
      clamped: false,
      range: { min: 40, max: 150 },
    })
  })
})
