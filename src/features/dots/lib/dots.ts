import { clamp } from "@/lib/units"

import { ageCoefficient, type AgeCoefficient } from "./age-coefficient"
import {
  DOTS_BODYWEIGHT_RANGE_KG,
  DOTS_COEFFICIENTS,
  DOTS_REFERENCE_SCORE,
  GLP_PARAMS,
  type GlpParams,
  type Quartic,
  type Sex,
} from "./constants"
import { glpDenominator, glpScore } from "./glp"

/** Calculator input, normalised to metric units. */
export interface DotsInput {
  bodyweightKg: number
  totalKg: number
  ageYears: number
  sex: Sex
}

/** The bodyweight the DOTS polynomial was evaluated at. */
export interface BodyweightUsed {
  kg: number
  /** True when the entered bodyweight fell outside the range DOTS is defined for. */
  clamped: boolean
  range: { min: number; max: number }
}

export function clampBodyweight(bodyweightKg: number, sex: Sex): BodyweightUsed {
  const range = DOTS_BODYWEIGHT_RANGE_KG[sex]
  const kg = clamp(bodyweightKg, range.min, range.max)
  return { kg, clamped: kg !== bodyweightKg, range }
}

/** P(BW): the total that scores exactly 500 DOTS at this bodyweight. No clamping. */
export function dotsPolynomial(bodyweightKg: number, sex: Sex) {
  const [a, b, c, d, e] = DOTS_COEFFICIENTS[sex]
  const bw = bodyweightKg
  return a * bw ** 4 + b * bw ** 3 + c * bw ** 2 + d * bw + e
}

export function dotsScore(totalKg: number, denominator: number) {
  return (totalKg * DOTS_REFERENCE_SCORE) / denominator
}

/** Every intermediate value of the calculation, so the UI can show its work. */
export interface DotsResult {
  input: DotsInput
  bodyweight: BodyweightUsed
  dots: { coefficients: Quartic; denominator: number; score: number }
  age: AgeCoefficient & { adjustedScore: number }
  /** GLP uses the bodyweight as entered; the IPF publishes no range for it. */
  glp: { params: GlpParams; denominator: number; score: number }
}

export function calculateDots(input: DotsInput): DotsResult {
  const { bodyweightKg, totalKg, ageYears, sex } = input

  const bodyweight = clampBodyweight(bodyweightKg, sex)
  const dotsDenominator = dotsPolynomial(bodyweight.kg, sex)
  const dots = dotsScore(totalKg, dotsDenominator)

  const age = ageCoefficient(ageYears)

  const glpDenom = glpDenominator(bodyweightKg, sex)

  return {
    input,
    bodyweight,
    dots: { coefficients: DOTS_COEFFICIENTS[sex], denominator: dotsDenominator, score: dots },
    age: { ...age, adjustedScore: dots * age.coefficient },
    glp: { params: GLP_PARAMS[sex], denominator: glpDenom, score: glpScore(totalKg, glpDenom) },
  }
}
