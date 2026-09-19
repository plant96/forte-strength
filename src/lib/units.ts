/** Exact international avoirdupois pound, in kilograms. */
export const KG_PER_LB = 0.45359237
export const LB_PER_KG = 1 / KG_PER_LB
export const CM_PER_IN = 2.54
export const IN_PER_FT = 12

/** Energy stored in one pound of body mass (the classic 3,500 kcal rule). */
export const KCAL_PER_LB = 3500
export const KCAL_PER_KG = KCAL_PER_LB * LB_PER_KG

export type WeightUnit = "lb" | "kg"
export type HeightUnit = "ft-in" | "cm"

export function lbToKg(lb: number) {
  return lb * KG_PER_LB
}

export function kgToLb(kg: number) {
  return kg * LB_PER_KG
}

export function ftInToCm(ft: number, inches: number) {
  return (ft * IN_PER_FT + inches) * CM_PER_IN
}

/** Splits a height in cm into whole feet and remaining inches (rounded to `decimals`). */
export function cmToFtIn(cm: number, decimals = 1) {
  const totalInches = roundTo(cm / CM_PER_IN, decimals)
  const ft = Math.floor(totalInches / IN_PER_FT)
  return { ft, in: roundTo(totalInches - ft * IN_PER_FT, decimals) }
}

export function roundTo(value: number, decimals = 0) {
  const factor = 10 ** decimals
  return Math.round(value * factor) / factor
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}
