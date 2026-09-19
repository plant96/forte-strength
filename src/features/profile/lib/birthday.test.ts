import { describe, expect, it } from "vitest"

import { ageOn, birthdayToDate, dateToBirthday, formatBirthday, isRealDate } from "./birthday"

/** A local calendar date, like `new Date()` on the user's machine. */
const localDate = (year: number, month: number, day: number) => new Date(year, month - 1, day)

describe("ageOn", () => {
  const birthday = { year: 1995, month: 6, day: 15 }

  it("counts a year on the birthday itself", () => {
    expect(ageOn(birthday, localDate(2025, 6, 14))).toBe(29)
    expect(ageOn(birthday, localDate(2025, 6, 15))).toBe(30)
    expect(ageOn(birthday, localDate(2025, 6, 16))).toBe(30)
  })

  it("handles earlier and later months", () => {
    expect(ageOn(birthday, localDate(2025, 1, 1))).toBe(29)
    expect(ageOn(birthday, localDate(2025, 12, 31))).toBe(30)
  })

  it("gives leap-day birthdays their year on March 1 in other years", () => {
    const leap = { year: 2000, month: 2, day: 29 }
    expect(ageOn(leap, localDate(2025, 2, 28))).toBe(24)
    expect(ageOn(leap, localDate(2025, 3, 1))).toBe(25)
    expect(ageOn(leap, localDate(2024, 2, 29))).toBe(24)
  })
})

describe("isRealDate", () => {
  it("rejects dates that don't exist", () => {
    expect(isRealDate({ year: 2023, month: 2, day: 29 })).toBe(false)
    expect(isRealDate({ year: 2024, month: 4, day: 31 })).toBe(false)
    expect(isRealDate({ year: 2024, month: 13, day: 1 })).toBe(false)
  })

  it("accepts real dates, including leap days", () => {
    expect(isRealDate({ year: 2024, month: 2, day: 29 })).toBe(true)
    expect(isRealDate({ year: 1990, month: 12, day: 31 })).toBe(true)
  })
})

describe("birthday ↔ date", () => {
  it("stores the calendar date at UTC midnight and reads it back unchanged", () => {
    const birthday = { year: 1999, month: 1, day: 1 }
    const date = birthdayToDate(birthday)
    expect(date.toISOString()).toBe("1999-01-01T00:00:00.000Z")
    expect(dateToBirthday(date)).toEqual(birthday)
  })

  it("formats for display", () => {
    expect(formatBirthday({ year: 1995, month: 6, day: 15 })).toBe("June 15, 1995")
  })
})
