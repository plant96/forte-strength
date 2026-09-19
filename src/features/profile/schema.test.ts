import { describe, expect, it } from "vitest"

import { createProfileSchema, PROFILE_FORM_DEFAULTS, type ProfileFormInput } from "./schema"

const TODAY = new Date(2026, 8, 19)
const schema = createProfileSchema(() => TODAY)

const VALID: ProfileFormInput = {
  ...PROFILE_FORM_DEFAULTS,
  birthMonth: "6",
  birthDay: "15",
  birthYear: "1995",
  sex: "male",
  weight: "180",
  heightFt: "5",
  heightIn: "10",
  bodyFat: "15",
  steps: "8000",
  sessions: "4",
  intensity: "moderate",
}

function errorsFor(input: Partial<ProfileFormInput>) {
  const result = schema.safeParse({ ...VALID, ...input })
  if (result.success) return {}
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))
}

describe("profile schema", () => {
  it("parses a complete profile", () => {
    expect(schema.parse(VALID)).toMatchObject({
      birthday: { year: 1995, month: 6, day: 15 },
      sex: "male",
      weight: 180,
      weightUnit: "lb",
      height: { unit: "ft-in", ft: 5, in: 10 },
      bodyFat: 15,
      steps: 8000,
      sessions: 4,
      intensity: "moderate",
    })
  })

  it("requires the birthday parts", () => {
    const errors = errorsFor({ birthMonth: "", birthDay: "", birthYear: "" })
    expect(errors).toMatchObject({
      birthMonth: "Pick your birth month",
      birthDay: "Enter the day",
      birthYear: "Enter the year",
    })
  })

  it("rejects dates that don't exist", () => {
    expect(errorsFor({ birthMonth: "2", birthDay: "30" })).toHaveProperty(
      "birthDay",
      "That date doesn't exist",
    )
  })

  it("rejects future years", () => {
    expect(errorsFor({ birthYear: "2030" })).toHaveProperty("birthYear")
  })

  it("keeps the age within what the calculators support", () => {
    // 15th birthday is tomorrow, so still 14.
    expect(errorsFor({ birthYear: "2011", birthMonth: "9", birthDay: "20" })).toHaveProperty(
      "birthYear",
    )
    expect(errorsFor({ birthYear: "2011", birthMonth: "9", birthDay: "19" })).toEqual({})
    expect(errorsFor({ birthYear: "1930" })).toHaveProperty("birthYear")
  })

  it("stores no intensity for zero training sessions", () => {
    expect(schema.parse({ ...VALID, sessions: "0", intensity: "" }).intensity).toBe("none")
  })

  it("still validates the body fields", () => {
    expect(errorsFor({ weight: "", sex: "" })).toMatchObject({
      weight: "Enter your weight",
      sex: "Select your sex",
    })
  })
})
