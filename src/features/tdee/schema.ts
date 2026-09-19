import { z } from "zod"

import { ftInToCm, lbToKg, type HeightUnit, type WeightUnit } from "@/lib/units"

import {
  INPUT_LIMITS,
  SELECTABLE_INTENSITY_LEVELS,
  type IntensityId,
  type Sex,
  type TrainingIntensityId,
} from "./lib/constants"
import type { TdeeInput } from "./lib/tdee"

/** Raw form state. Numeric fields stay strings so partially typed input is preserved. */
export interface TdeeFormInput {
  weight: string
  weightUnit: WeightUnit
  heightUnit: HeightUnit
  heightFt: string
  heightIn: string
  heightCm: string
  age: string
  sex: Sex | ""
  bodyFat: string
  steps: string
  sessions: string
  intensity: TrainingIntensityId | ""
}

/** Validated form values, still in the units the user chose. */
export interface TdeeFormValues {
  weight: number
  weightUnit: WeightUnit
  height: { unit: "ft-in"; ft: number; in: number } | { unit: "cm"; cm: number }
  age: number
  sex: Sex
  bodyFat: number
  steps: number
  sessions: number
  /** "none" whenever sessions is 0. */
  intensity: IntensityId
}

export const TDEE_FORM_DEFAULTS: TdeeFormInput = {
  weight: "",
  weightUnit: "lb",
  heightUnit: "ft-in",
  heightFt: "",
  heightIn: "",
  heightCm: "",
  age: "",
  sex: "",
  bodyFat: "",
  steps: "",
  sessions: "",
  intensity: "",
}

const NUMBER_PATTERN = /^(\d+\.?\d*|\.\d+)$/

/** Parses a user-typed number ("1,200", "5.", ".5"). Returns null when it isn't one. */
export function parseNumberInput(raw: string): number | null {
  const text = raw.trim().replace(/,/g, "")
  if (!NUMBER_PATTERN.test(text)) return null
  return Number(text)
}

interface NumberRule {
  /** Used in messages, e.g. "Weight must be 70–700 lb". */
  label: string
  min: number
  max: number
  unit?: string
  integer?: boolean
  /** When set, an empty field is allowed and parses to this value. */
  emptyValue?: number
  requiredMessage?: string
}

const intensityIds = SELECTABLE_INTENSITY_LEVELS.map((level) => level.id) as [
  TrainingIntensityId,
  ...TrainingIntensityId[],
]

const rawSchema = z.object({
  weight: z.string(),
  weightUnit: z.enum(["lb", "kg"]),
  heightUnit: z.enum(["ft-in", "cm"]),
  heightFt: z.string(),
  heightIn: z.string(),
  heightCm: z.string(),
  age: z.string(),
  sex: z.enum(["male", "female", ""]),
  bodyFat: z.string(),
  steps: z.string(),
  sessions: z.string(),
  intensity: z.enum([...intensityIds, ""]),
})

export const tdeeFormSchema = rawSchema.transform((raw, ctx): TdeeFormValues => {
  let valid = true

  const fail = (field: keyof TdeeFormInput, message: string) => {
    valid = false
    ctx.addIssue({ code: "custom", message, path: [field] })
  }

  const read = (field: keyof TdeeFormInput, rule: NumberRule): number => {
    const text = raw[field].trim()
    if (text === "" && rule.emptyValue !== undefined) return rule.emptyValue
    if (text === "") {
      fail(field, rule.requiredMessage ?? `Enter your ${rule.label.toLowerCase()}`)
      return Number.NaN
    }

    const value = parseNumberInput(text)
    if (value === null) {
      fail(field, "Enter a number")
      return Number.NaN
    }
    if (rule.integer && !Number.isInteger(value)) {
      fail(field, "Use a whole number")
      return Number.NaN
    }
    if (value < rule.min || value > rule.max) {
      const unit = rule.unit ? (rule.unit === "%" ? "%" : ` ${rule.unit}`) : ""
      fail(
        field,
        `${rule.label} must be ${rule.min.toLocaleString("en-US")}–${rule.max.toLocaleString("en-US")}${unit}`,
      )
      return Number.NaN
    }
    return value
  }

  const weightLimits = INPUT_LIMITS.weight[raw.weightUnit]
  const weight = read("weight", { label: "Weight", unit: raw.weightUnit, ...weightLimits })

  let height: TdeeFormValues["height"]
  if (raw.heightUnit === "cm") {
    height = {
      unit: "cm",
      cm: read("heightCm", { label: "Height", unit: "cm", ...INPUT_LIMITS.heightCm }),
    }
  } else {
    height = {
      unit: "ft-in",
      ft: read("heightFt", {
        label: "Feet",
        unit: "ft",
        integer: true,
        requiredMessage: "Enter your height",
        ...INPUT_LIMITS.heightFt,
      }),
      in: read("heightIn", {
        label: "Inches",
        unit: "in",
        emptyValue: 0,
        ...INPUT_LIMITS.heightIn,
      }),
    }
  }

  const age = read("age", { label: "Age", unit: "years", integer: true, ...INPUT_LIMITS.age })

  if (raw.sex === "") fail("sex", "Select your sex")

  const bodyFat = read("bodyFat", { label: "Body fat", unit: "%", ...INPUT_LIMITS.bodyFat })
  const steps = read("steps", {
    label: "Steps",
    requiredMessage: "Enter your average daily steps",
    integer: true,
    ...INPUT_LIMITS.steps,
  })
  const sessions = read("sessions", {
    label: "Sessions",
    requiredMessage: "Enter your weekly training sessions",
    integer: true,
    ...INPUT_LIMITS.sessions,
  })

  let intensity: IntensityId = "none"
  if (sessions > 0) {
    if (raw.intensity === "") fail("intensity", "Select how hard you train")
    else intensity = raw.intensity
  }

  if (!valid || raw.sex === "") return z.NEVER

  return {
    weight,
    weightUnit: raw.weightUnit,
    height,
    age,
    sex: raw.sex,
    bodyFat,
    steps,
    sessions,
    intensity,
  }
})

/** Converts validated form values into the metric input the calculator expects. */
export function toTdeeInput(values: TdeeFormValues): TdeeInput {
  return {
    weightKg: values.weightUnit === "kg" ? values.weight : lbToKg(values.weight),
    heightCm:
      values.height.unit === "cm" ? values.height.cm : ftInToCm(values.height.ft, values.height.in),
    ageYears: values.age,
    sex: values.sex,
    bodyFatPercent: values.bodyFat,
    stepsPerDay: values.steps,
    sessionsPerWeek: values.sessions,
    intensity: values.intensity,
  }
}
