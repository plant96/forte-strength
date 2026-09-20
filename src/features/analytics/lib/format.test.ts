import { describe, expect, it } from "vitest"

import { analyticsTimezone, formatTrafficTime } from "./format"

describe("analytics display time", () => {
  it("falls back to UTC for an invalid configured zone", () => {
    expect(analyticsTimezone("Not/A_Timezone")).toBe("UTC")
    expect(analyticsTimezone("  ")).toBe("UTC")
    expect(analyticsTimezone(" America/New_York ")).toBe("America/New_York")
  })

  it("keeps local midnight on the correct date regardless of the browser zone", () => {
    expect(formatTrafficTime("2026-09-19T04:00:00Z", "30d", "America/New_York")).toBe("Sep 19")
    expect(formatTrafficTime("2026-09-19T00:00:00Z", "30d", "America/New_York")).toBe("Sep 18")
  })

  it("distinguishes the two fall-back hours in the detailed label", () => {
    const before = formatTrafficTime("2026-11-01T05:00:00Z", "24h", "America/New_York", true)
    const after = formatTrafficTime("2026-11-01T06:00:00Z", "24h", "America/New_York", true)
    expect(before).toContain("1:00 AM")
    expect(after).toContain("1:00 AM")
    expect(before).not.toBe(after)
  })

  it("labels monthly data in its configured zone", () => {
    expect(formatTrafficTime("2026-08-31T15:00:00Z", "12mo", "Asia/Tokyo", true)).toBe("September 2026")
  })
})
