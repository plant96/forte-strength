import { z } from "zod"

import { createFormReader } from "@/lib/forms/reader"
import type { WeightUnit } from "@/lib/units"
import {
  BODY_FIELD_DEFAULTS,
  bodyFieldsShape,
  readBodyFields,
  type BodyFieldsInput,
  type BodyFieldsValues,
} from "@/features/tdee/body-fields"
import { INPUT_LIMITS } from "@/features/tdee/lib/constants"

import { ageOn, isRealDate, type Birthday } from "./lib/birthday"

/** Raw profile form state: the calculator's body fields plus a birthday. */
export interface ProfileFormInput extends BodyFieldsInput {
  birthMonth: string
  birthDay: string
  birthYear: string
  /**
   * How they read gym weights. Deliberately not part of `bodyFieldsShape`: the TDEE
   * calculator has no use for it, and it is saved onto `User`, not `Profile`.
   */
  liftUnit: WeightUnit
}

export interface ProfileFormValues extends BodyFieldsValues {
  birthday: Birthday
  liftUnit: WeightUnit
}

export const PROFILE_FORM_DEFAULTS: ProfileFormInput = {
  ...BODY_FIELD_DEFAULTS,
  birthMonth: "",
  birthDay: "",
  birthYear: "",
  liftUnit: "lb",
}

export const BIRTHDAY_FIELDS = ["birthMonth", "birthDay", "birthYear"] as const

/** Builds the schema with an injectable "today" so age checks are testable. */
export function createProfileSchema(today: () => Date = () => new Date()) {
  return z
    .object({
      ...bodyFieldsShape,
      birthMonth: z.string(),
      birthDay: z.string(),
      birthYear: z.string(),
      liftUnit: z.enum(["lb", "kg"]),
    })
    .transform((raw, ctx): ProfileFormValues => {
      const reader = createFormReader(raw, ctx)
      const now = today()

      const month = reader.number("birthMonth", {
        label: "Month",
        integer: true,
        min: 1,
        max: 12,
        requiredMessage: "Pick your birth month",
      })
      const day = reader.number("birthDay", {
        label: "Day",
        integer: true,
        min: 1,
        max: 31,
        requiredMessage: "Enter the day",
      })
      const year = reader.number("birthYear", {
        label: "Year",
        integer: true,
        min: 1900,
        max: now.getFullYear(),
        requiredMessage: "Enter the year",
      })

      const birthday = { year, month, day }
      if (reader.valid) {
        if (!isRealDate(birthday)) {
          reader.fail("birthDay", "That date doesn't exist")
        } else {
          const age = ageOn(birthday, now)
          if (age < INPUT_LIMITS.age.min || age > INPUT_LIMITS.age.max) {
            reader.fail(
              "birthYear",
              `The calculators support ages ${INPUT_LIMITS.age.min}–${INPUT_LIMITS.age.max}`,
            )
          }
        }
      }

      const body = readBodyFields(raw, reader)
      if (!body || !reader.valid) return z.NEVER
      return { ...body, birthday, liftUnit: raw.liftUnit }
    })
}

export const profileFormSchema = createProfileSchema()
