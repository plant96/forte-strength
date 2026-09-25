import { describe, expect, it } from "vitest"

import { dotsFormSchema } from "@/features/dots/schema"
import { tdeeFormSchema } from "@/features/tdee/schema"

import {
  profileRecordToDotsFormInput,
  profileRecordToFormInput,
  profileRecordToTdeeFormInput,
  profileRecordToTdeeInput,
  profileValuesToRecord,
} from "./mappers"
import { createProfileSchema, PROFILE_FORM_DEFAULTS, type ProfileFormInput } from "./schema"

const TODAY = new Date(2026, 8, 19)
const schema = createProfileSchema(() => TODAY)

const IMPERIAL: ProfileFormInput = {
  ...PROFILE_FORM_DEFAULTS,
  birthMonth: "6",
  birthDay: "15",
  birthYear: "1995",
  sex: "male",
  weight: "180.5",
  weightUnit: "lb",
  heightUnit: "ft-in",
  heightFt: "5",
  heightIn: "10",
  bodyFat: "15",
  steps: "8000",
  sessions: "4",
  intensity: "moderate",
}

const METRIC: ProfileFormInput = {
  ...IMPERIAL,
  sex: "female",
  weight: "62",
  weightUnit: "kg",
  heightUnit: "cm",
  heightCm: "168",
  bodyFat: "24",
  sessions: "0",
  intensity: "",
}

const toRecord = (input: ProfileFormInput) => profileValuesToRecord(schema.parse(input))

describe("profile mappers", () => {
  it("stores database enums and height in cm", () => {
    expect(toRecord(IMPERIAL)).toEqual({
      birthDate: new Date("1995-06-15T00:00:00.000Z"),
      sex: "MALE",
      weight: 180.5,
      weightUnit: "LB",
      heightCm: 177.8,
      heightUnit: "FT_IN",
      bodyFatPercent: 15,
      stepsPerDay: 8000,
      sessionsPerWeek: 4,
      intensity: "MODERATE",
    })
    expect(toRecord(METRIC)).toMatchObject({ sex: "FEMALE", weightUnit: "KG", intensity: null })
  })

  it.each([
    ["imperial", IMPERIAL],
    ["metric", METRIC],
  ])("round-trips a %s profile through the database shape", (_label, input) => {
    const restored = profileRecordToFormInput(toRecord(input))
    expect(restored).toMatchObject({
      birthMonth: input.birthMonth,
      birthDay: input.birthDay,
      birthYear: input.birthYear,
      sex: input.sex,
      weight: input.weight,
      weightUnit: input.weightUnit,
      heightUnit: input.heightUnit,
      bodyFat: input.bodyFat,
      steps: input.steps,
      sessions: input.sessions,
      intensity: input.intensity,
    })
    if (input.heightUnit === "cm") expect(restored.heightCm).toBe(input.heightCm)
    else expect([restored.heightFt, restored.heightIn]).toEqual([input.heightFt, input.heightIn])
  })

  it("fills the calculator with today's age in the user's units", () => {
    const formInput = profileRecordToTdeeFormInput(toRecord(IMPERIAL), TODAY)
    expect(formInput).toMatchObject({ age: "31", weight: "180.5", heightFt: "5", heightIn: "10" })
    // The autofilled form is valid as-is.
    expect(tdeeFormSchema.safeParse(formInput).success).toBe(true)
  })

  it("fills the DOTS calculator, leaving the total blank in the user's lift unit", () => {
    const formInput = profileRecordToDotsFormInput(toRecord(IMPERIAL), "kg", TODAY)
    expect(formInput).toEqual({
      weight: "180.5",
      weightUnit: "lb",
      total: "",
      totalUnit: "kg",
      age: "31",
      sex: "male",
    })
    // Only the total is missing.
    const parsed = dotsFormSchema.safeParse(formInput)
    expect(parsed.success).toBe(false)
    expect(parsed.error?.issues.map((issue) => issue.path[0])).toEqual(["total"])
  })

  it("converts to metric calculator input", () => {
    const input = profileRecordToTdeeInput(toRecord(METRIC), TODAY)
    expect(input).toEqual({
      weightKg: 62,
      heightCm: 168,
      ageYears: 31,
      sex: "female",
      bodyFatPercent: 24,
      stepsPerDay: 8000,
      sessionsPerWeek: 0,
      intensity: "none",
    })
  })
})
