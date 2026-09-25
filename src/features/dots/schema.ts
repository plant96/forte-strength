import { z } from "zod"

import { weightToKg } from "@/features/tdee/body-fields"
import { createFormReader, parseNumberInput } from "@/lib/forms/reader"
import { lbToKg, type WeightUnit } from "@/lib/units"

import { DOTS_INPUT_LIMITS, type ScoreKind, type Sex } from "./lib/constants"
import type { DotsInput } from "./lib/dots"

export { parseNumberInput }

/** Raw calculator form state. Numeric fields stay strings so partially typed input is preserved. */
export interface DotsFormInput {
  weight: string
  weightUnit: WeightUnit
  total: string
  totalUnit: WeightUnit
  age: string
  sex: Sex | ""
}

/** Validated calculator values, still in the units the user chose. */
export interface DotsFormValues {
  weight: number
  weightUnit: WeightUnit
  total: number
  totalUnit: WeightUnit
  age: number
  sex: Sex
}

export const DOTS_FORM_DEFAULTS: DotsFormInput = {
  weight: "",
  weightUnit: "lb",
  total: "",
  totalUnit: "lb",
  age: "",
  sex: "",
}

export const dotsFormSchema = z
  .object({
    weight: z.string(),
    weightUnit: z.enum(["lb", "kg"]),
    total: z.string(),
    totalUnit: z.enum(["lb", "kg"]),
    age: z.string(),
    sex: z.enum(["male", "female", ""]),
  })
  .transform((raw, ctx): DotsFormValues => {
    const reader = createFormReader(raw, ctx)
    const weight = reader.number("weight", {
      label: "Weight",
      unit: raw.weightUnit,
      ...DOTS_INPUT_LIMITS.weight[raw.weightUnit],
    })
    const total = reader.number("total", {
      label: "Total",
      unit: raw.totalUnit,
      requiredMessage: "Enter your total",
      ...DOTS_INPUT_LIMITS.total[raw.totalUnit],
    })
    const age = reader.number("age", {
      label: "Age",
      unit: "years",
      integer: true,
      ...DOTS_INPUT_LIMITS.age,
    })
    if (raw.sex === "") reader.fail("sex", "Select your sex")

    if (!reader.valid || raw.sex === "") return z.NEVER
    return {
      weight,
      weightUnit: raw.weightUnit,
      total,
      totalUnit: raw.totalUnit,
      age,
      sex: raw.sex,
    }
  })

export function totalToKg(values: Pick<DotsFormValues, "total" | "totalUnit">) {
  return values.totalUnit === "kg" ? values.total : lbToKg(values.total)
}

/** Converts validated form values into the metric input the calculator expects. */
export function toDotsInput(values: DotsFormValues): DotsInput {
  return {
    bodyweightKg: weightToKg(values),
    totalKg: totalToKg(values),
    ageYears: values.age,
    sex: values.sex,
  }
}

export type DesiredScore = { value: number; error: null } | { value: null; error: string }

/**
 * Reads the reverse calculator's target score. Returns null while the box is empty, so the
 * outputs simply wait rather than complain.
 */
export function parseDesiredScore(raw: string, kind: ScoreKind): DesiredScore | null {
  if (raw.trim() === "") return null
  const value = parseNumberInput(raw)
  if (value === null) return { value: null, error: "Enter a number" }
  const { min, max } = DOTS_INPUT_LIMITS.score[kind]
  if (value < min || value > max) {
    return {
      value: null,
      error: `Score must be ${min.toLocaleString("en-US")}–${max.toLocaleString("en-US")}`,
    }
  }
  return { value, error: null }
}
