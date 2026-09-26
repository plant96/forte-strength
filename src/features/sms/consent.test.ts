import { describe, expect, it } from "vitest"

import { SMS_CONSENT_TEXT, smsPromptDue } from "./consent"

const NOW = new Date("2026-09-26T12:00:00Z")
const daysAgo = (days: number) => new Date(NOW.getTime() - days * 86_400_000)

describe("SMS_CONSENT_TEXT", () => {
  it("carries every disclosure carriers check for", () => {
    expect(SMS_CONSENT_TEXT).toContain("Forte Strength Systems")
    expect(SMS_CONSENT_TEXT).toContain("Message frequency varies.")
    expect(SMS_CONSENT_TEXT).toContain("Message and data rates may apply.")
    expect(SMS_CONSENT_TEXT).toContain("Reply HELP for help or STOP to cancel at any time.")
    expect(SMS_CONSENT_TEXT).toContain("Consent is not a condition of purchase.")
  })
})

describe("smsPromptDue", () => {
  it("asks someone who has never answered", () => {
    expect(smsPromptDue({ smsOptInAt: null, smsPromptSnoozedAt: null }, NOW)).toBe(true)
  })

  it("never asks someone who opted in", () => {
    expect(smsPromptDue({ smsOptInAt: daysAgo(30), smsPromptSnoozedAt: null }, NOW)).toBe(false)
  })

  it("waits a week after 'Not now', then asks again", () => {
    expect(smsPromptDue({ smsOptInAt: null, smsPromptSnoozedAt: daysAgo(6) }, NOW)).toBe(false)
    expect(smsPromptDue({ smsOptInAt: null, smsPromptSnoozedAt: daysAgo(7) }, NOW)).toBe(true)
  })
})
