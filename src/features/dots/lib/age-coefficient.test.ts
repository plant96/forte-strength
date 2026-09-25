import { describe, expect, it } from "vitest"

import { AGE_COEFFICIENT_RANGE, AGE_COEFFICIENT_TABLE, ageCoefficient } from "./age-coefficient"

describe("ageCoefficient", () => {
  it.each(AGE_COEFFICIENT_TABLE.map((row) => [row.age, row.coefficient]))(
    "returns the listed coefficient for age %i",
    (age, coefficient) => {
      const result = ageCoefficient(age)
      expect(result.coefficient).toBe(coefficient)
      expect(result.interpolated).toBe(false)
      expect(result.clamped).toBe(false)
    },
  )

  it.each([24, 30, 35, 38])("is exactly 1 for open-age lifters (%i)", (age) => {
    const result = ageCoefficient(age)
    expect(result.coefficient).toBe(1)
    expect(result.interpolated).toBe(false)
  })

  it("interpolates linearly between listed masters ages", () => {
    const at42 = ageCoefficient(42)
    expect(at42.coefficient).toBeCloseTo(1.0104, 4)
    expect(at42.interpolated).toBe(true)
    expect(at42.lower).toEqual({ age: 40, coefficient: 1 })
    expect(at42.upper).toEqual({ age: 45, coefficient: 1.026 })

    expect(ageCoefficient(57).coefficient).toBeCloseTo(1.1496, 4)
    expect(ageCoefficient(72).coefficient).toBeCloseTo(1.4714, 4)
  })

  it("clamps ages outside the table to its ends", () => {
    expect(AGE_COEFFICIENT_RANGE).toEqual({ min: 14, max: 95 })

    const young = ageCoefficient(10)
    expect(young).toMatchObject({ coefficient: 1.23, usedAge: 14, clamped: true })

    const old = ageCoefficient(100)
    expect(old).toMatchObject({ coefficient: 2.526, usedAge: 95, clamped: true })
  })
})
