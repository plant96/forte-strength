import { ageCoefficient } from "./age-coefficient"
import { DOTS_REFERENCE_SCORE, GLP_REFERENCE_SCORE, type ScoreKind, type Sex } from "./constants"
import { clampBodyweight, dotsPolynomial, type BodyweightUsed } from "./dots"
import { glpDenominator } from "./glp"

export interface ReverseInput {
  kind: ScoreKind
  /** The score the lifter wants. */
  score: number
  bodyweightKg: number
  ageYears: number
  sex: Sex
}

/** The total a target score needs, with the intermediate values for the breakdown. */
export interface ReverseResult {
  input: ReverseInput
  /** For GLP this is the bodyweight as entered, never clamped. */
  bodyweight: BodyweightUsed
  /** P(BW) for DOTS, A − B·e^(−C·BW) for GLP. */
  denominator: number
  totalKg: number
  /** DOTS only: the smaller total that reaches the score once the age coefficient applies. */
  ageAdjusted: { coefficient: number; totalKg: number } | null
}

/** Both scores are proportional to the total, so each inverts in one step. */
export function calculateRequiredTotal(input: ReverseInput): ReverseResult {
  const { kind, score, bodyweightKg, ageYears, sex } = input

  if (kind === "glp") {
    const denominator = glpDenominator(bodyweightKg, sex)
    return {
      input,
      bodyweight: { kg: bodyweightKg, clamped: false, range: { min: 0, max: Infinity } },
      denominator,
      totalKg: (score * denominator) / GLP_REFERENCE_SCORE,
      ageAdjusted: null,
    }
  }

  const bodyweight = clampBodyweight(bodyweightKg, sex)
  const denominator = dotsPolynomial(bodyweight.kg, sex)
  const totalKg = (score * denominator) / DOTS_REFERENCE_SCORE
  const { coefficient } = ageCoefficient(ageYears)
  return {
    input,
    bodyweight,
    denominator,
    totalKg,
    ageAdjusted: { coefficient, totalKg: totalKg / coefficient },
  }
}
