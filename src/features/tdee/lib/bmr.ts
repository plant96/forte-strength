import type { Sex } from "./constants"

export interface BodyMetrics {
  weightKg: number
  heightCm: number
  ageYears: number
  sex: Sex
  bodyFatPercent: number
}

/** Roza & Shizgal (1984) revision of the Harris-Benedict equation. */
export const HARRIS_BENEDICT_REVISED = {
  male: { base: 88.362, weight: 13.397, height: 4.799, age: 5.677 },
  female: { base: 447.593, weight: 9.247, height: 3.098, age: 4.33 },
} as const

/** Mifflin et al. (1990). */
export const MIFFLIN_ST_JEOR = {
  weight: 10,
  height: 6.25,
  age: 5,
  sexOffset: { male: 5, female: -161 },
} as const

/** Katch-McArdle, based on lean body mass. */
export const KATCH_MCARDLE = { base: 370, leanMass: 21.6 } as const

export function harrisBenedictRevised({ weightKg, heightCm, ageYears, sex }: BodyMetrics) {
  const c = HARRIS_BENEDICT_REVISED[sex]
  return c.base + c.weight * weightKg + c.height * heightCm - c.age * ageYears
}

export function mifflinStJeor({ weightKg, heightCm, ageYears, sex }: BodyMetrics) {
  const c = MIFFLIN_ST_JEOR
  return c.weight * weightKg + c.height * heightCm - c.age * ageYears + c.sexOffset[sex]
}

export function leanBodyMass(weightKg: number, bodyFatPercent: number) {
  return weightKg * (1 - bodyFatPercent / 100)
}

export function katchMcArdle(leanMassKg: number) {
  return KATCH_MCARDLE.base + KATCH_MCARDLE.leanMass * leanMassKg
}

export interface BmrBreakdown {
  leanMassKg: number
  harrisBenedict: number
  mifflinStJeor: number
  katchMcArdle: number
  /** Mean of the three equations — the BMR used for TDEE. */
  average: number
}

export function calculateBmr(metrics: BodyMetrics): BmrBreakdown {
  const leanMassKg = leanBodyMass(metrics.weightKg, metrics.bodyFatPercent)
  const hb = harrisBenedictRevised(metrics)
  const msj = mifflinStJeor(metrics)
  const km = katchMcArdle(leanMassKg)

  return {
    leanMassKg,
    harrisBenedict: hb,
    mifflinStJeor: msj,
    katchMcArdle: km,
    average: (hb + msj + km) / 3,
  }
}
