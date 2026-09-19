import { clamp } from "@/lib/units"

/**
 * Tunable constants for the Forte Strength activity model.
 * With these values the multiplier spans exactly 1.01 (sedentary) to 1.80.
 */
export const ACTIVITY_MODEL = {
  /** Steps per day beyond which walking adds nothing more. */
  stepCap: 18_000,
  /** Curvature of the step curve (higher = earlier steps count for more). */
  stepCurve: 1.8,
  /** Maximum contribution of daily steps. */
  stepMax: 0.33,
  /** Sessions per week beyond which training frequency adds nothing more. */
  sessionCap: 5,
  /** Curvature of the training curve. */
  trainingCurve: 1.6,
  /** Maximum contribution of training. */
  trainingMax: 0.5,
  /** Maximum overlap correction when both steps and training are maxed. */
  overlapMax: 0.04,
  /** Multiplier for someone with no steps and no training. */
  baseline: 1.01,
  multiplierMin: 1.01,
  multiplierMax: 1.8,
} as const

/** Normalised saturating curve: 0 at t = 0, 1 at t = 1, with diminishing returns. */
function saturate(t: number, curvature: number) {
  return (1 - Math.exp(-curvature * t)) / (1 - Math.exp(-curvature))
}

/** x = min(P / 18000, 1) */
export function stepRatio(stepsPerDay: number) {
  return clamp(stepsPerDay / ACTIVITY_MODEL.stepCap, 0, 1)
}

/** S = 0.33 · (1 − e^(−1.8x)) / (1 − e^(−1.8)) */
export function stepComponent(x: number) {
  return ACTIVITY_MODEL.stepMax * saturate(x, ACTIVITY_MODEL.stepCurve)
}

/** f = min(F, 5) / 5 */
export function frequencyRatio(sessionsPerWeek: number) {
  return clamp(sessionsPerWeek, 0, ACTIVITY_MODEL.sessionCap) / ACTIVITY_MODEL.sessionCap
}

/** T = 0.50 · (1 − e^(−1.6q)) / (1 − e^(−1.6)) */
export function trainingComponent(q: number) {
  return ACTIVITY_MODEL.trainingMax * saturate(q, ACTIVITY_MODEL.trainingCurve)
}

/** D = 0.04 · (S / 0.33) · (T / 0.50) */
export function overlapCorrection(s: number, t: number) {
  const { overlapMax, stepMax, trainingMax } = ACTIVITY_MODEL
  return overlapMax * (s / stepMax) * (t / trainingMax)
}

export interface ActivityInput {
  stepsPerDay: number
  sessionsPerWeek: number
  /** Intensity score I, from 0 (no training) to 1 (very hard). */
  intensityScore: number
}

export interface ActivityBreakdown {
  x: number
  s: number
  f: number
  q: number
  t: number
  d: number
  /** 1.01 + S + T − D, before the safety clamp. */
  rawMultiplier: number
  /** The multiplier M actually applied to BMR. */
  multiplier: number
  stepsCapped: boolean
  sessionsCapped: boolean
  multiplierClamped: boolean
}

export function calculateActivity({
  stepsPerDay,
  sessionsPerWeek,
  intensityScore,
}: ActivityInput): ActivityBreakdown {
  const { baseline, multiplierMin, multiplierMax, stepCap, sessionCap } = ACTIVITY_MODEL

  const x = stepRatio(stepsPerDay)
  const s = stepComponent(x)
  const f = frequencyRatio(sessionsPerWeek)
  const q = f * intensityScore
  const t = trainingComponent(q)
  const d = overlapCorrection(s, t)
  const rawMultiplier = baseline + s + t - d
  const multiplier = clamp(rawMultiplier, multiplierMin, multiplierMax)

  return {
    x,
    s,
    f,
    q,
    t,
    d,
    rawMultiplier,
    multiplier,
    stepsCapped: stepsPerDay > stepCap,
    sessionsCapped: sessionsPerWeek > sessionCap,
    multiplierClamped: multiplier !== rawMultiplier,
  }
}
