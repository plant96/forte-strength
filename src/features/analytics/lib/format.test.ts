import { describe, expect, it } from "vitest"

import { ADMIN_TIME_ZONE, formatHour, timeZoneLabel } from "@/lib/dates"

import { formatTrafficTime } from "./format"

describe("analytics display time", () => {
  it("keeps local midnight on the correct date regardless of the browser zone", () => {
    expect(formatTrafficTime("2026-09-19T04:00:00Z", "30d", ADMIN_TIME_ZONE)).toBe("Sep 19")
    expect(formatTrafficTime("2026-09-19T00:00:00Z", "30d", ADMIN_TIME_ZONE)).toBe("Sep 18")
  })

  it("distinguishes the two fall-back hours in the detailed label", () => {
    const before = formatTrafficTime("2026-11-01T05:00:00Z", "24h", ADMIN_TIME_ZONE, true)
    const after = formatTrafficTime("2026-11-01T06:00:00Z", "24h", ADMIN_TIME_ZONE, true)
    expect(before).toContain("1:00 AM")
    expect(after).toContain("1:00 AM")
    expect(before).not.toBe(after)
  })

  it("labels monthly data in its configured zone", () => {
    expect(formatTrafficTime("2026-08-31T15:00:00Z", "12mo", "Asia/Tokyo", true)).toBe(
      "September 2026",
    )
  })

  it("never shows a 24-hour clock", () => {
    // The dashboard's hour axis and its detailed tick labels are the two places a raw
    // hour could leak through.
    const label = formatTrafficTime("2026-06-01T22:00:00Z", "24h", ADMIN_TIME_ZONE, true)
    expect(label).toMatch(/(AM|PM)/)
    expect(label).not.toMatch(/\b(13|14|15|16|17|18|19|20|21|22|23):/)
  })
})

describe("formatHour", () => {
  it("reads as a clock, not a counter", () => {
    expect(formatHour(0)).toBe("12am")
    expect(formatHour(6)).toBe("6am")
    expect(formatHour(11)).toBe("11am")
    expect(formatHour(12)).toBe("12pm")
    expect(formatHour(13)).toBe("1pm")
    expect(formatHour(18)).toBe("6pm")
    expect(formatHour(23)).toBe("11pm")
  })

  it("never returns a bare 24-hour number", () => {
    for (let hour = 0; hour < 24; hour++) {
      expect(formatHour(hour)).toMatch(/^(1[0-2]|[1-9])(am|pm)$/)
    }
  })
})

describe("timeZoneLabel", () => {
  it("follows daylight saving rather than asserting one name all year", () => {
    // Late June and mid-January, both in the coach's zone.
    expect(timeZoneLabel(new Date("2026-06-21T16:00:00Z"))).toBe("Eastern Daylight Time")
    expect(timeZoneLabel(new Date("2026-01-15T16:00:00Z"))).toBe("Eastern Standard Time")
  })
})
