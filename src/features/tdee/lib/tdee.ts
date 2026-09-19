import { calculateActivity, type ActivityBreakdown } from "./activity"
import { calculateBmr, type BmrBreakdown } from "./bmr"
import { getIntensityLevel, type IntensityId, type Sex } from "./constants"

/** Calculator input, normalised to metric units. */
export interface TdeeInput {
  weightKg: number
  heightCm: number
  ageYears: number
  sex: Sex
  bodyFatPercent: number
  stepsPerDay: number
  sessionsPerWeek: number
  intensity: IntensityId
}

/** Every intermediate value of the calculation, so the UI can show its work. */
export interface TdeeResult {
  input: TdeeInput
  /** I — 0 whenever the user trains 0 sessions per week. */
  intensityScore: number
  bmr: BmrBreakdown
  activity: ActivityBreakdown
  tdee: number
}

export function calculateTdee(input: TdeeInput): TdeeResult {
  const intensityScore = input.sessionsPerWeek > 0 ? getIntensityLevel(input.intensity).score : 0

  const bmr = calculateBmr(input)
  const activity = calculateActivity({
    stepsPerDay: input.stepsPerDay,
    sessionsPerWeek: input.sessionsPerWeek,
    intensityScore,
  })

  return {
    input,
    intensityScore,
    bmr,
    activity,
    tdee: bmr.average * activity.multiplier,
  }
}
