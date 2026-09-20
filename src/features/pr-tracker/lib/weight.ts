import { kgToLb, lbToKg, roundTo, type WeightUnit } from "@/lib/units"

/**
 * Weights are stored in kg and shown in whichever unit the lifter reads plates in.
 *
 * Display rounds to one decimal, which is finer than any plate and coarse enough that a
 * lb -> kg -> lb round trip lands back on the number they typed (225 lb reads as 225 lb,
 * not 224.9999999).
 */

export function toKg(weight: number, unit: WeightUnit) {
  return unit === "kg" ? weight : lbToKg(weight)
}

export function fromKg(kg: number, unit: WeightUnit) {
  return roundTo(unit === "kg" ? kg : kgToLb(kg), 1)
}

/** "225 lb", "102.5 kg" — a whole number never shows a pointless ".0". */
export function formatWeight(kg: number, unit: WeightUnit) {
  return `${formatWeightValue(kg, unit)} ${unit}`
}

export function formatWeightValue(kg: number, unit: WeightUnit) {
  const value = fromKg(kg, unit)
  return Number.isInteger(value) ? String(value) : value.toFixed(1)
}

/** A signed gain, for "+10 lb" chips. */
export function formatDelta(kg: number, unit: WeightUnit) {
  const value = fromKg(Math.abs(kg), unit)
  const rendered = Number.isInteger(value) ? String(value) : value.toFixed(1)
  return `${kg < 0 ? "-" : "+"}${rendered} ${unit}`
}

/** Sensible bounds, so a slipped keypress can't poison a series with 22500 lb. */
export const WEIGHT_LIMITS: Record<WeightUnit, { min: number; max: number }> = {
  lb: { min: 1, max: 2000 },
  kg: { min: 0.5, max: 900 },
}
