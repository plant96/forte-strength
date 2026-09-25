import { describe, expect, it } from "vitest"

import { calculateDots } from "./dots"
import { calculateRequiredTotal } from "./reverse"

const LIFTER = { bodyweightKg: 93, ageYears: 50, sex: "male" as const }

describe("calculateRequiredTotal", () => {
  it("inverts the DOTS score back to the total", () => {
    const forward = calculateDots({ ...LIFTER, totalKg: 700 })
    const reverse = calculateRequiredTotal({ ...LIFTER, kind: "dots", score: forward.dots.score })

    expect(reverse.totalKg).toBeCloseTo(700, 6)
    expect(reverse.denominator).toBeCloseTo(forward.dots.denominator, 10)
  })

  it("inverts the GLP score back to the total", () => {
    const forward = calculateDots({ ...LIFTER, totalKg: 700 })
    const reverse = calculateRequiredTotal({ ...LIFTER, kind: "glp", score: forward.glp.score })

    expect(reverse.totalKg).toBeCloseTo(700, 6)
    expect(reverse.denominator).toBeCloseTo(forward.glp.denominator, 10)
  })

  it("divides the DOTS requirement by the age coefficient", () => {
    const reverse = calculateRequiredTotal({ ...LIFTER, kind: "dots", score: 500 })

    expect(reverse.totalKg).toBeCloseTo(785.8532, 4)
    expect(reverse.ageAdjusted).not.toBeNull()
    expect(reverse.ageAdjusted?.coefficient).toBe(1.066)
    expect(reverse.ageAdjusted?.totalKg).toBeCloseTo(785.8532 / 1.066, 3)
  })

  it("has no age adjustment for GLP", () => {
    const reverse = calculateRequiredTotal({ ...LIFTER, kind: "glp", score: 100 })

    expect(reverse.totalKg).toBeCloseTo(764.4024, 4)
    expect(reverse.ageAdjusted).toBeNull()
    expect(reverse.bodyweight.clamped).toBe(false)
  })

  it("clamps the bodyweight for DOTS like the forward calculation", () => {
    const reverse = calculateRequiredTotal({
      kind: "dots",
      score: 400,
      bodyweightKg: 250,
      ageYears: 30,
      sex: "male",
    })
    expect(reverse.bodyweight).toMatchObject({ kg: 210, clamped: true })
  })
})
