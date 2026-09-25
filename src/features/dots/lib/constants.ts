import { INPUT_LIMITS, type Sex } from "@/features/tdee/lib/constants"

export type { Sex }

export type ScoreKind = "dots" | "glp"

export const SCORE_KINDS = [
  { id: "dots", label: "DOTS" },
  { id: "glp", label: "GLP" },
] as const satisfies ReadonlyArray<{ id: ScoreKind; label: string }>

/** Milestone scores offered as one-tap targets in the reverse calculator. */
export const SCORE_PRESETS: Record<ScoreKind, readonly number[]> = {
  dots: [300, 400, 500, 600],
  glp: [75, 100, 125, 150],
}

/** Coefficients of a·BW⁴ + b·BW³ + c·BW² + d·BW + e, with BW in kg. */
export type Quartic = readonly [a: number, b: number, c: number, d: number, e: number]

/** The DOTS bodyweight polynomial, per sex (USA Powerlifting). */
export const DOTS_COEFFICIENTS: Record<Sex, Quartic> = {
  male: [-0.000001093, 0.0007391293, -0.1918759221, 24.0900756, -307.75076],
  female: [-0.0000010706, 0.0005158568, -0.1126655495, 13.6175032, -57.96288],
}

/** The bodyweights DOTS is defined for. Input outside is clamped to the nearest end. */
export const DOTS_BODYWEIGHT_RANGE_KG: Record<Sex, { min: number; max: number }> = {
  male: { min: 40, max: 210 },
  female: { min: 40, max: 150 },
}

/** Total scored 500 DOTS at the reference. */
export const DOTS_REFERENCE_SCORE = 500

export interface GlpParams {
  A: number
  B: number
  C: number
}

/** IPF GL formula constants, classic (raw) division, effective 1 May 2020. */
export const GLP_PARAMS: Record<Sex, GlpParams> = {
  male: { A: 1199.72839, B: 1025.18162, C: 0.00921 },
  female: { A: 610.32796, B: 1045.59282, C: 0.03048 },
}

/** Total scores 100 GL points at the reference. */
export const GLP_REFERENCE_SCORE = 100

/** Accepted input ranges. Values outside these are rejected by the form. */
export const DOTS_INPUT_LIMITS = {
  weight: INPUT_LIMITS.weight,
  total: { lb: { min: 45, max: 3_300 }, kg: { min: 20, max: 1_500 } },
  /** The span of the age coefficient table. */
  age: { min: 14, max: 95 },
  score: { dots: { min: 1, max: 1_500 }, glp: { min: 1, max: 300 } },
} as const
