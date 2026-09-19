import { KCAL_PER_LB, LB_PER_KG, type WeightUnit } from "@/lib/units"

export type GoalDirection = "bulk" | "cut"

/** Weekly rates of change offered for each unit. */
export const RATE_PRESETS = {
  lb: [0.25, 0.5, 1, 2],
  kg: [0.1, 0.25, 0.5, 1],
} as const satisfies Record<WeightUnit, readonly number[]>

export function rateToLb(ratePerWeek: number, unit: WeightUnit) {
  return unit === "kg" ? ratePerWeek * LB_PER_KG : ratePerWeek
}

/** Daily calorie surplus/deficit for a weekly rate: 3500 · DD / 7, with DD in lb/week. */
export function dailyCalorieDelta(ratePerWeek: number, unit: WeightUnit) {
  return (KCAL_PER_LB * rateToLb(ratePerWeek, unit)) / 7
}

export interface GoalTarget {
  direction: GoalDirection
  /** Weekly rate in the display unit (always positive). */
  rate: number
  unit: WeightUnit
  rateLb: number
  /** Daily calorie adjustment (always positive). */
  dailyDelta: number
  /** Daily calorie target. */
  calories: number
  /** True when a cut target drops below the averaged BMR. */
  belowBmr: boolean
}

export interface GoalTargets {
  bulk: GoalTarget[]
  cut: GoalTarget[]
}

export function calculateGoalTargets(tdee: number, bmr: number, unit: WeightUnit): GoalTargets {
  const build = (direction: GoalDirection) =>
    RATE_PRESETS[unit].map((rate): GoalTarget => {
      const dailyDelta = dailyCalorieDelta(rate, unit)
      const calories = direction === "bulk" ? tdee + dailyDelta : tdee - dailyDelta
      return {
        direction,
        rate,
        unit,
        rateLb: rateToLb(rate, unit),
        dailyDelta,
        calories,
        belowBmr: calories < bmr,
      }
    })

  return { bulk: build("bulk"), cut: build("cut") }
}
