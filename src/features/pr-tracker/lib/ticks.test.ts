import { describe, expect, it } from "vitest"

import { dateTickCount, pickDateTicks, spansYears } from "./ticks"

const on = (...days: string[]) => days.map((achievedOn) => ({ achievedOn }))

describe("spansYears", () => {
  it("is false inside one year, or with fewer than two records", () => {
    expect(spansYears(on("2026-01-05", "2026-11-30"))).toBe(false)
    expect(spansYears(on("2026-01-05"))).toBe(false)
    expect(spansYears([])).toBe(false)
  })

  it("is true once the first and last records fall in different years", () => {
    expect(spansYears(on("2024-12-31", "2025-01-01"))).toBe(true)
    expect(spansYears(on("2023-03-03", "2024-06-06", "2026-08-12"))).toBe(true)
  })
})

describe("dateTickCount", () => {
  it("fits four labels on a wide plot either way", () => {
    expect(dateTickCount(600, false)).toBe(4)
    expect(dateTickCount(600, true)).toBe(4)
  })

  it("fits fewer full dates than short ones on a phone", () => {
    // A 320px phone leaves roughly 180px of plot.
    expect(dateTickCount(180, false)).toBe(3)
    expect(dateTickCount(180, true)).toBe(2)
  })

  it("never drops below two", () => {
    expect(dateTickCount(0, true)).toBe(2)
    expect(dateTickCount(50, false)).toBe(2)
  })
})

describe("pickDateTicks", () => {
  it("labels every record when there are few", () => {
    expect(pickDateTicks(on("2026-01-01", "2026-02-01"), 4)).toEqual(["2026-01-01", "2026-02-01"])
  })

  it("thins to the requested count, keeping the first and last", () => {
    const ticks = pickDateTicks(
      on("2026-01-01", "2026-02-01", "2026-03-01", "2026-04-01", "2026-05-01"),
      3,
    )
    expect(ticks).toEqual(["2026-01-01", "2026-03-01", "2026-05-01"])
  })

  it("never labels the same day twice", () => {
    expect(pickDateTicks(on("2026-01-01", "2026-01-01", "2026-01-01"), 4)).toEqual(["2026-01-01"])
  })

  it("returns nothing for a sparkline", () => {
    expect(pickDateTicks(on("2026-01-01", "2026-02-01"), 0)).toEqual([])
  })
})
