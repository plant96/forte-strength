import { z } from "zod"

import { createFormReader } from "@/lib/forms/reader"

import {
  BODY_FIELD_DEFAULTS,
  bodyFieldsShape,
  heightToCm,
  readBodyFields,
  weightToKg,
  type BodyFieldsInput,
  type BodyFieldsValues,
} from "./body-fields"
import { INPUT_LIMITS } from "./lib/constants"
import type { TdeeInput } from "./lib/tdee"

export { parseNumberInput } from "@/lib/forms/reader"

/** Raw calculator form state: the shared body fields plus age. */
export interface TdeeFormInput extends BodyFieldsInput {
  age: string
}

/** Validated calculator values, still in the units the user chose. */
export interface TdeeFormValues extends BodyFieldsValues {
  age: number
}

export const TDEE_FORM_DEFAULTS: TdeeFormInput = { ...BODY_FIELD_DEFAULTS, age: "" }

export const tdeeFormSchema = z
  .object({ ...bodyFieldsShape, age: z.string() })
  .transform((raw, ctx): TdeeFormValues => {
    const reader = createFormReader(raw, ctx)
    const body = readBodyFields(raw, reader)
    const age = reader.number("age", {
      label: "Age",
      unit: "years",
      integer: true,
      ...INPUT_LIMITS.age,
    })

    if (!body || !reader.valid) return z.NEVER
    return { ...body, age }
  })

/** Converts validated form values into the metric input the calculator expects. */
export function toTdeeInput(values: TdeeFormValues): TdeeInput {
  return {
    weightKg: weightToKg(values),
    heightCm: heightToCm(values.height),
    ageYears: values.age,
    sex: values.sex,
    bodyFatPercent: values.bodyFat,
    stepsPerDay: values.steps,
    sessionsPerWeek: values.sessions,
    intensity: values.intensity,
  }
}
