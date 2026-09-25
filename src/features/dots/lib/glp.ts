import { GLP_PARAMS, GLP_REFERENCE_SCORE, type Sex } from "./constants"

/** The IPF GL reference total, A − B·e^(−C·BW): the total worth exactly 100 points. */
export function glpDenominator(bodyweightKg: number, sex: Sex) {
  const { A, B, C } = GLP_PARAMS[sex]
  return A - B * Math.exp(-C * bodyweightKg)
}

export function glpScore(totalKg: number, denominator: number) {
  return (totalKg * GLP_REFERENCE_SCORE) / denominator
}
