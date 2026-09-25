import { clamp } from "@/lib/units"

export interface AgeCoefficientRow {
  age: number
  coefficient: number
}

/**
 * USA Powerlifting age coefficients: youth (14–22) and masters (40+). Between 23 and 39
 * the coefficient is 1.00. Masters ages are listed every five years; ages in between are
 * interpolated linearly.
 */
export const AGE_COEFFICIENT_TABLE: readonly AgeCoefficientRow[] = [
  { age: 14, coefficient: 1.23 },
  { age: 15, coefficient: 1.18 },
  { age: 16, coefficient: 1.13 },
  { age: 17, coefficient: 1.08 },
  { age: 18, coefficient: 1.06 },
  { age: 19, coefficient: 1.04 },
  { age: 20, coefficient: 1.03 },
  { age: 21, coefficient: 1.02 },
  { age: 22, coefficient: 1.01 },
  { age: 23, coefficient: 1.0 },
  { age: 39, coefficient: 1.0 },
  { age: 40, coefficient: 1.0 },
  { age: 45, coefficient: 1.026 },
  { age: 50, coefficient: 1.066 },
  { age: 55, coefficient: 1.12 },
  { age: 60, coefficient: 1.194 },
  { age: 65, coefficient: 1.29 },
  { age: 70, coefficient: 1.411 },
  { age: 75, coefficient: 1.562 },
  { age: 80, coefficient: 1.745 },
  { age: 85, coefficient: 1.965 },
  { age: 90, coefficient: 2.224 },
  { age: 95, coefficient: 2.526 },
]

const first = AGE_COEFFICIENT_TABLE[0]!
const last = AGE_COEFFICIENT_TABLE[AGE_COEFFICIENT_TABLE.length - 1]!

/** The ages the table covers. Ages outside use the nearest end. */
export const AGE_COEFFICIENT_RANGE = { min: first.age, max: last.age }

export interface AgeCoefficient {
  coefficient: number
  /** The age actually looked up, after clamping to the table. */
  usedAge: number
  clamped: boolean
  /** The table rows either side of the age. Equal when the age is listed. */
  lower: AgeCoefficientRow
  upper: AgeCoefficientRow
  /** True when the age sits between two listed ages with different coefficients. */
  interpolated: boolean
}

export function ageCoefficient(ageYears: number): AgeCoefficient {
  const usedAge = clamp(ageYears, AGE_COEFFICIENT_RANGE.min, AGE_COEFFICIENT_RANGE.max)
  const clamped = usedAge !== ageYears

  let lower = first
  let upper = last
  for (const row of AGE_COEFFICIENT_TABLE) {
    if (row.age <= usedAge) lower = row
    if (row.age >= usedAge) {
      upper = row
      break
    }
  }

  if (lower.age === upper.age || lower.coefficient === upper.coefficient) {
    return { coefficient: lower.coefficient, usedAge, clamped, lower, upper, interpolated: false }
  }

  const fraction = (usedAge - lower.age) / (upper.age - lower.age)
  const coefficient = lower.coefficient + (upper.coefficient - lower.coefficient) * fraction
  return { coefficient, usedAge, clamped, lower, upper, interpolated: true }
}
