import { describe, expect, it } from "vitest"

import {
  APPLICATION_DEFAULTS,
  applicationSchema,
  isCommitmentPhrase,
  type ApplicationFormInput,
} from "./schema"

const VALID: ApplicationFormInput = {
  ...APPLICATION_DEFAULTS,
  fullName: "Jordan Lee",
  age: "27",
  email: "Jordan.Lee@Example.com",
  phone: "(407) 555-0142",
  location: "Tampa, FL",
  instagram: "@jordan.lifts",
  primaryNeed: "COMPETITIVE_POWERLIFTING",
  squat: "405",
  bench: "275",
  deadlift: "500",
  liftsAreCompetition: true,
  weightClass: "90 kg",
  goals: "Qualify for Nationals.",
  challenges: "Staying consistent.",
  overthinker: "7",
  injuries: "None",
  nutritionRestrictions: "None",
  programming: "4 days, upper/lower.",
  currentCoach: "NO_BUT_HAVE_BEFORE",
  whyForte: "Saw the team on Instagram.",
  commitment: "I am prepared",
  financePriority: "SOLID_AFFORDABLE",
  readiness: "READY_NOW",
}

function errorsFor(input: Partial<ApplicationFormInput>) {
  const result = applicationSchema.safeParse({ ...VALID, ...input })
  if (result.success) return {}
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))
}

describe("applicationSchema", () => {
  it("accepts a complete application and normalizes it", () => {
    const result = applicationSchema.parse(VALID)
    expect(result).toMatchObject({
      email: "jordan.lee@example.com",
      instagram: "jordan.lifts",
      age: 27,
      squat: 405,
      bench: 275,
      deadlift: 500,
      overthinker: 7,
      primaryNeedOther: null,
      commitment: "I am prepared",
      isSpam: false,
    })
  })

  it("requires every field", () => {
    const result = applicationSchema.safeParse(APPLICATION_DEFAULTS)
    expect(result.success).toBe(false)
    const fields = new Set(result.error?.issues.map((issue) => issue.path[0]))
    for (const field of [
      "fullName",
      "age",
      "email",
      "phone",
      "location",
      "instagram",
      "primaryNeed",
      "squat",
      "bench",
      "deadlift",
      "weightClass",
      "goals",
      "challenges",
      "overthinker",
      "injuries",
      "nutritionRestrictions",
      "programming",
      "currentCoach",
      "whyForte",
      "commitment",
      "financePriority",
      "readiness",
    ]) {
      expect(fields, field).toContain(field)
    }
    // Only asked for when "Other" is picked, and the honeypot is never required.
    expect(fields).not.toContain("primaryNeedOther")
    expect(fields).not.toContain("website")
  })

  it("asks for details when the primary need is Other", () => {
    expect(errorsFor({ primaryNeed: "OTHER" })).toHaveProperty(
      "primaryNeedOther",
      "Tell us what you need",
    )
    const result = applicationSchema.parse({
      ...VALID,
      primaryNeed: "OTHER",
      primaryNeedOther: "  Strongman  ",
    })
    expect(result.primaryNeedOther).toBe("Strongman")
  })

  it("ignores stale Other text when another need is picked", () => {
    const result = applicationSchema.parse({ ...VALID, primaryNeedOther: "Strongman" })
    expect(result.primaryNeedOther).toBeNull()
  })

  it("only accepts “I am prepared” as the commitment", () => {
    expect(errorsFor({ commitment: "I guess" })).toHaveProperty("commitment")
    expect(errorsFor({ commitment: "i AM prepared!" })).toEqual({})
    expect(applicationSchema.parse({ ...VALID, commitment: "i am prepared." }).commitment).toBe(
      "I am prepared",
    )
  })

  it("keeps the overthinker score between 1 and 10", () => {
    expect(errorsFor({ overthinker: "0" })).toHaveProperty("overthinker")
    expect(errorsFor({ overthinker: "11" })).toHaveProperty("overthinker")
    expect(errorsFor({ overthinker: "5.5" })).toHaveProperty("overthinker")
    expect(errorsFor({ overthinker: "1" })).toEqual({})
    expect(errorsFor({ overthinker: "10" })).toEqual({})
  })

  it("limits lifts by unit", () => {
    expect(errorsFor({ squat: "-5" })).toHaveProperty("squat")
    expect(errorsFor({ deadlift: "1200", liftUnit: "lb" })).toEqual({})
    expect(errorsFor({ deadlift: "1200", liftUnit: "kg" })).toHaveProperty("deadlift")
    expect(errorsFor({ bench: "0" })).toEqual({})
    expect(applicationSchema.parse({ ...VALID, bench: "142.5", liftUnit: "kg" })).toMatchObject({
      bench: 142.5,
      liftUnit: "kg",
    })
  })

  it("validates contact details", () => {
    expect(errorsFor({ email: "not-an-email" })).toHaveProperty("email", "Enter a valid email")
    expect(errorsFor({ phone: "call me" })).toHaveProperty("phone")
    expect(errorsFor({ phone: "12345" })).toHaveProperty("phone")
    expect(errorsFor({ phone: "+44 20 7946 0958" })).toEqual({})
    expect(errorsFor({ instagram: "has spaces" })).toHaveProperty("instagram")
  })

  it("flags submissions that fill in the honeypot", () => {
    expect(applicationSchema.parse({ ...VALID, website: "https://spam.example" }).isSpam).toBe(true)
  })
})

describe("isCommitmentPhrase", () => {
  it.each(["I am prepared", "i am prepared", "  I  am   prepared!! "])("accepts %j", (text) => {
    expect(isCommitmentPhrase(text)).toBe(true)
  })

  it.each(["", "I am", "I am not prepared", "I am prepared, mostly"])("rejects %j", (text) => {
    expect(isCommitmentPhrase(text)).toBe(false)
  })
})
