import { describe, expect, it } from "vitest"

import {
  addMonths,
  clampDay,
  dayParts,
  daysBetween,
  daysInMonth,
  describeDay,
  firstWeekday,
  formatDay,
  formatDayShort,
  isDay,
  makeDay,
  monthsBetween,
} from "./day"

/**
 * A half-typed date reaches the UI as an empty string, and `Intl.DateTimeFormat` throws a
 * RangeError on an invalid Date — which is how typing a `0` into a month once took the
 * whole page down mid-render. Everything that reads a day has to be total.
 */
const NOT_DAYS = [
  "",
  " ",
  "0",
  "2026",
  "2026-00-10", // month 0 — the original crash
  "2026-13-01",
  "2026-01-32",
  "2026-02-30", // not a real date, even though the shape is right
  "2026-1-1", // unpadded
  "nonsense",
  "2026-01-01T00:00:00Z",
]

describe("isDay", () => {
  it("rejects anything that is not a real, padded calendar date", () => {
    for (const value of NOT_DAYS) expect(isDay(value)).toBe(false)
  })

  it("accepts real dates, including a leap day", () => {
    for (const value of ["2026-01-01", "2024-02-29", "1900-12-31"]) {
      expect(isDay(value)).toBe(true)
    }
  })
})

describe("formatters never throw", () => {
  it("returns an empty string instead of raising on junk", () => {
    for (const value of NOT_DAYS) {
      expect(() => formatDay(value)).not.toThrow()
      expect(() => formatDayShort(value)).not.toThrow()
      expect(() => describeDay(value)).not.toThrow()
      expect(formatDay(value)).toBe("")
      expect(formatDayShort(value)).toBe("")
      expect(describeDay(value)).toBe("")
    }
  })

  it("still formats a real day", () => {
    expect(formatDay("2026-08-12")).toBe("Aug 12, 2026")
    expect(formatDayShort("2026-08-12")).toBe("Aug 12")
  })

  it("reads the day in UTC, not the viewer's timezone", () => {
    // A UTC-midnight date rendered in a western timezone would show the day before.
    expect(formatDay("2026-01-01")).toBe("Jan 1, 2026")
  })
})

describe("daysBetween", () => {
  it("counts whole days", () => {
    expect(daysBetween("2026-08-01", "2026-08-12")).toBe(11)
    expect(daysBetween("2026-08-12", "2026-08-01")).toBe(-11)
  })

  it("is NaN rather than a wrong number for junk", () => {
    expect(daysBetween("", "2026-08-01")).toBeNaN()
    expect(daysBetween("2026-08-01", "oops")).toBeNaN()
  })
})

describe("monthsBetween", () => {
  it("measures a year as twelve months", () => {
    expect(monthsBetween("2025-09-20", "2026-09-20")).toBeCloseTo(12, 1)
  })

  it("is zero on the same day and tiny across a month boundary", () => {
    expect(monthsBetween("2026-09-20", "2026-09-20")).toBe(0)
    expect(monthsBetween("2026-09-30", "2026-10-01")).toBeLessThan(0.1)
  })

  it("is NaN rather than a wrong number for junk", () => {
    expect(monthsBetween("", "2026-08-01")).toBeNaN()
  })
})

describe("describeDay", () => {
  it("speaks in relative terms near today", () => {
    expect(describeDay("2026-09-20", "2026-09-20")).toBe("today")
    expect(describeDay("2026-09-19", "2026-09-20")).toBe("yesterday")
    expect(describeDay("2026-09-17", "2026-09-20")).toBe("3 days ago")
    expect(describeDay("2026-09-06", "2026-09-20")).toBe("2 weeks ago")
  })

  it("falls back to a plain date far out", () => {
    expect(describeDay("2020-01-01", "2026-09-20")).toBe("Jan 1, 2020")
  })
})

describe("makeDay", () => {
  it("zero-pads the parts", () => {
    expect(makeDay(2026, 1, 5)).toBe("2026-01-05")
  })

  it("refuses parts that are not a real date", () => {
    expect(makeDay(2026, 2, 30)).toBe("")
    expect(makeDay(2026, 0, 10)).toBe("")
    expect(makeDay(2026, 13, 1)).toBe("")
  })
})

describe("addMonths", () => {
  it("clamps the day into a shorter month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28")
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29")
  })

  it("crosses year boundaries in both directions", () => {
    expect(addMonths("2026-01-15", -1)).toBe("2025-12-15")
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15")
  })

  it("leaves junk alone rather than inventing a date", () => {
    expect(addMonths("", 1)).toBe("")
  })
})

describe("calendar grid helpers", () => {
  it("knows month lengths, including leap years", () => {
    expect(daysInMonth(2026, 2)).toBe(28)
    expect(daysInMonth(2024, 2)).toBe(29)
    expect(daysInMonth(2026, 1)).toBe(31)
    expect(daysInMonth(2026, 4)).toBe(30)
  })

  it("finds the weekday a month starts on", () => {
    // 1 Feb 2026 is a Sunday.
    expect(firstWeekday(2026, 2)).toBe(0)
  })
})

describe("clampDay", () => {
  it("pulls a day into range", () => {
    expect(clampDay("2030-01-01", "2020-01-01", "2026-09-20")).toBe("2026-09-20")
    expect(clampDay("2010-01-01", "2020-01-01", "2026-09-20")).toBe("2020-01-01")
    expect(clampDay("2024-05-05", "2020-01-01", "2026-09-20")).toBe("2024-05-05")
  })

  it("ignores bounds that are not real days", () => {
    expect(clampDay("2024-05-05", "", "")).toBe("2024-05-05")
  })
})

describe("dayParts", () => {
  it("splits a day", () => {
    expect(dayParts("2026-08-12")).toEqual({ year: 2026, month: 8, dayOfMonth: 12 })
  })

  it("is null for junk", () => {
    expect(dayParts("2026-00-01")).toBeNull()
  })
})
