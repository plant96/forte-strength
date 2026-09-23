import { describe, expect, it } from "vitest"

import { BUG_REPORT_DEFAULTS, bugReportSchema } from "./schema"

function errorsFor(input: Partial<typeof BUG_REPORT_DEFAULTS>) {
  const result = bugReportSchema.safeParse({ ...BUG_REPORT_DEFAULTS, ...input })
  if (result.success) return {}
  return Object.fromEntries(result.error.issues.map((issue) => [issue.path[0], issue.message]))
}

const VALID = "Something is broken here"

describe("bugReportSchema", () => {
  it("accepts a description, trims it, and keeps the path", () => {
    const parsed = bugReportSchema.parse({
      ...BUG_REPORT_DEFAULTS,
      description: "  The chart does not render on my phone.  ",
      path: "/tools/pr-tracker",
    })
    expect(parsed).toEqual({
      description: "The chart does not render on my phone.",
      email: null,
      path: "/tools/pr-tracker",
      isSpam: false,
    })
  })

  it("requires at least ten characters and caps the length", () => {
    expect(errorsFor({ description: "" })).toEqual({ description: "Tell us what went wrong" })
    expect(errorsFor({ description: "too short" }).description).toMatch(/at least 10/)
    expect(errorsFor({ description: "x".repeat(2001) }).description).toMatch(/2,000/)
  })

  it("validates the optional email", () => {
    expect(errorsFor({ description: VALID, email: "nope" })).toEqual({
      email: "Enter a valid email address",
    })
    const parsed = bugReportSchema.parse({
      ...BUG_REPORT_DEFAULTS,
      description: VALID,
      email: " sam@example.com ",
    })
    expect(parsed.email).toBe("sam@example.com")
  })

  it("falls back to the root path for anything that is not a site path", () => {
    const parse = (path: string) =>
      bugReportSchema.parse({ ...BUG_REPORT_DEFAULTS, description: VALID, path })
    expect(parse("//evil.example").path).toBe("/")
    expect(parse("https://evil.example").path).toBe("/")
    expect(parse("").path).toBe("/")
  })

  it("flags the honeypot", () => {
    const parsed = bugReportSchema.parse({
      ...BUG_REPORT_DEFAULTS,
      description: VALID,
      website: "http://spam.example",
    })
    expect(parsed.isSpam).toBe(true)
  })
})
