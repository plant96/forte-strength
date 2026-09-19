import { z } from "zod"

import { ftInToCm, lbToKg, type HeightUnit, type WeightUnit } from "@/lib/units"
import type { FormReader } from "@/lib/forms/reader"

import {
  INPUT_LIMITS,
  SELECTABLE_INTENSITY_LEVELS,
  type IntensityId,
  type Sex,
  type TrainingIntensityId,
} from "./lib/constants"

/**
 * Body and activity fields shared by the calculator, onboarding and profile forms.
 * Numeric fields stay strings so partially typed input is preserved.
 */
export interface BodyFieldsInput {
  weight: string
  weightUnit: WeightUnit
  heightUnit: HeightUnit
  heightFt: string
  heightIn: string
  heightCm: string
  sex: Sex | ""
  bodyFat: string
  steps: string
  sessions: string
  intensity: TrainingIntensityId | ""
}

/** Validated body and activity values, still in the units the user chose. */
export interface BodyFieldsValues {
  weight: number
  weightUnit: WeightUnit
  height: { unit: "ft-in"; ft: number; in: number } | { unit: "cm"; cm: number }
  sex: Sex
  bodyFat: number
  steps: number
  sessions: number
  /** "none" whenever sessions is 0. */
  intensity: IntensityId
}

export const BODY_FIELD_DEFAULTS: BodyFieldsInput = {
  weight: "",
  weightUnit: "lb",
  heightUnit: "ft-in",
  heightFt: "",
  heightIn: "",
  heightCm: "",
  sex: "",
  bodyFat: "",
  steps: "",
  sessions: "",
  intensity: "",
}

const intensityIds = SELECTABLE_INTENSITY_LEVELS.map((level) => level.id) as [
  TrainingIntensityId,
  ...TrainingIntensityId[],
]

/** Raw Zod shape for the shared fields, to spread into a form's `z.object`. */
export const bodyFieldsShape = {
  weight: z.string(),
  weightUnit: z.enum(["lb", "kg"]),
  heightUnit: z.enum(["ft-in", "cm"]),
  heightFt: z.string(),
  heightIn: z.string(),
  heightCm: z.string(),
  sex: z.enum(["male", "female", ""]),
  bodyFat: z.string(),
  steps: z.string(),
  sessions: z.string(),
  intensity: z.enum([...intensityIds, ""]),
}

/** Validates the shared fields, reporting errors through `reader`. Returns null when invalid. */
export function readBodyFields(
  raw: BodyFieldsInput,
  reader: FormReader<BodyFieldsInput>,
): BodyFieldsValues | null {
  const weight = reader.number("weight", {
    label: "Weight",
    unit: raw.weightUnit,
    ...INPUT_LIMITS.weight[raw.weightUnit],
  })

  let height: BodyFieldsValues["height"]
  if (raw.heightUnit === "cm") {
    height = {
      unit: "cm",
      cm: reader.number("heightCm", { label: "Height", unit: "cm", ...INPUT_LIMITS.heightCm }),
    }
  } else {
    height = {
      unit: "ft-in",
      ft: reader.number("heightFt", {
        label: "Feet",
        unit: "ft",
        integer: true,
        requiredMessage: "Enter your height",
        ...INPUT_LIMITS.heightFt,
      }),
      in: reader.number("heightIn", {
        label: "Inches",
        unit: "in",
        emptyValue: 0,
        ...INPUT_LIMITS.heightIn,
      }),
    }
  }

  if (raw.sex === "") reader.fail("sex", "Select your sex")

  const bodyFat = reader.number("bodyFat", {
    label: "Body fat",
    unit: "%",
    ...INPUT_LIMITS.bodyFat,
  })
  const steps = reader.number("steps", {
    label: "Steps",
    requiredMessage: "Enter your average daily steps",
    integer: true,
    ...INPUT_LIMITS.steps,
  })
  const sessions = reader.number("sessions", {
    label: "Sessions",
    requiredMessage: "Enter your weekly training sessions",
    integer: true,
    ...INPUT_LIMITS.sessions,
  })

  let intensity: IntensityId = "none"
  if (sessions > 0) {
    if (raw.intensity === "") reader.fail("intensity", "Select how hard you train")
    else intensity = raw.intensity
  }

  if (!reader.valid || raw.sex === "") return null

  return {
    weight,
    weightUnit: raw.weightUnit,
    height,
    sex: raw.sex,
    bodyFat,
    steps,
    sessions,
    intensity,
  }
}

export function weightToKg(values: Pick<BodyFieldsValues, "weight" | "weightUnit">) {
  return values.weightUnit === "kg" ? values.weight : lbToKg(values.weight)
}

export function heightToCm(height: BodyFieldsValues["height"]) {
  return height.unit === "cm" ? height.cm : ftInToCm(height.ft, height.in)
}
