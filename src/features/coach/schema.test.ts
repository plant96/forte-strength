import { describe, expect, it } from "vitest"

import { COACH_PROFILE_DEFAULTS, coachReachSentence, coachRecords } from "@/config/coaching"

import { coachProfileSchema, coachProfileToFormInput, parseReach } from "./schema"

const VALID = coachProfileToFormInput(COACH_PROFILE_DEFAULTS)

describe("parseReach", () => {
  it("splits on commas, semicolons and new lines", () => {
    expect(parseReach("12 states, the UK; Romania\nCanada,, ")).toEqual([
      "12 states",
      "the UK",
      "Romania",
      "Canada",
    ])
    expect(parseReach("   ")).toEqual([])
  })
})

describe("coachProfileSchema", () => {
  it("round-trips the defaults", () => {
    expect(coachProfileSchema.parse(VALID)).toEqual(COACH_PROFILE_DEFAULTS)
  })

  it("parses edited record counts", () => {
    const result = coachProfileSchema.parse({
      ...VALID,
      worldRecords: "3",
      americanRecords: "12",
      stateRecords: "40",
    })
    expect(coachRecords(result).map((record) => record.value)).toEqual(["3×", "12×", "40"])
  })

  it("rejects negative, fractional and missing counts", () => {
    for (const worldRecords of ["-1", "1.5", ""]) {
      const result = coachProfileSchema.safeParse({ ...VALID, worldRecords })
      expect(result.success, worldRecords).toBe(false)
      expect(result.error?.issues[0]?.path).toEqual(["worldRecords"])
    }
  })

  it("requires the text fields", () => {
    const result = coachProfileSchema.safeParse({ ...VALID, name: " ", bio: "" })
    expect(result.error?.issues.map((issue) => issue.path[0])).toEqual(["name", "bio"])
  })

  it("limits the reach list", () => {
    const tooMany = Array.from({ length: 13 }, (_, index) => `Place ${index + 1}`).join(", ")
    expect(coachProfileSchema.safeParse({ ...VALID, reach: tooMany }).success).toBe(false)
  })
})

describe("coachReachSentence", () => {
  it("reads naturally", () => {
    expect(coachReachSentence(COACH_PROFILE_DEFAULTS)).toMatch(/^Based in Orlando, FL/)
  })
})
