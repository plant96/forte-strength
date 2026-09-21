/**
 * Calendar days, as "YYYY-MM-DD" strings.
 *
 * A PR happened on a *date*, not at an instant, and `PrEntry.achievedOn` is a Postgres
 * `DATE` that Prisma hands back as UTC midnight. Formatting one of those with the site's
 * usual `formatDate` (which renders in the coach's timezone) would show the day before.
 * So days stay strings everywhere above the database: they compare with `<`, they survive
 * the server/client boundary unchanged, and they cannot drift.
 */

export type Day = string

const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function isDay(value: string): value is Day {
  if (!DAY_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && toDay(parsed) === value
}

/** The UTC-midnight `Date` Prisma wants for a `@db.Date` column. */
export function dayToDate(day: Day) {
  return new Date(`${day}T00:00:00.000Z`)
}

/** The day a `Date` falls on, read in UTC. */
export function toDay(date: Date): Day {
  return date.toISOString().slice(0, 10)
}

/** Today in the viewer's own timezone, which is the day they mean when they log a lift. */
export function today(now: Date = new Date()): Day {
  const offset = now.getTimezoneOffset() * 60_000
  return new Date(now.getTime() - offset).toISOString().slice(0, 10)
}

const dayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
})

const shortDayFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
})

/**
 * Every formatter below refuses a day it cannot parse rather than throwing.
 *
 * `Intl.DateTimeFormat.format` raises a RangeError on an invalid Date, and a half-typed
 * date reaches the UI as an empty string — a browser reports "" for a date input until all
 * three parts are valid, so typing a `0` into the month blanks the value. Formatting that
 * during render took the whole page down. Anything that renders a day has to be total.
 */

/** "Aug 12, 2026", or "" when the day is not a real date. */
export function formatDay(day: Day) {
  if (!isDay(day)) return ""
  return dayFormat.format(dayToDate(day))
}

/** "Aug 12" — for axis ticks, where the year is carried by the axis as a whole. */
export function formatDayShort(day: Day) {
  if (!isDay(day)) return ""
  return shortDayFormat.format(dayToDate(day))
}

/** Whole days between two days, positive when `b` is later. NaN if either is not a day. */
export function daysBetween(a: Day, b: Day) {
  if (!isDay(a) || !isDay(b)) return Number.NaN
  return Math.round((dayToDate(b).getTime() - dayToDate(a).getTime()) / 86_400_000)
}

/** "today", "yesterday", "3 days ago", "5 weeks ago", then a plain date past a year. */
export function describeDay(day: Day, now: Day = today()) {
  const diff = daysBetween(day, now)
  if (Number.isNaN(diff)) return ""
  if (diff === 0) return "today"
  if (diff === 1) return "yesterday"
  if (diff < 0) return formatDay(day)
  if (diff < 7) return `${diff} days ago`
  if (diff < 31) {
    const weeks = Math.round(diff / 7)
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`
  }
  if (diff < 365) {
    const months = Math.round(diff / 30)
    return months === 1 ? "1 month ago" : `${months} months ago`
  }
  return formatDay(day)
}

/** Clamps a day into an inclusive range, ignoring bounds that are not real days. */
export function clampDay(day: Day, min?: Day, max?: Day): Day {
  if (min && isDay(min) && day < min) return min
  if (max && isDay(max) && day > max) return max
  return day
}

/** Shifts a day by whole months, clamping the day-of-month into the target month. */
export function addMonths(day: Day, months: number): Day {
  if (!isDay(day)) return day
  const date = dayToDate(day)
  const target = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, 1))
  const lastDay = daysInMonth(target.getUTCFullYear(), target.getUTCMonth() + 1)
  return makeDay(
    target.getUTCFullYear(),
    target.getUTCMonth() + 1,
    Math.min(date.getUTCDate(), lastDay),
  )
}

/** Days in a 1-indexed month. */
export function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate()
}

/** Weekday of the first of a month, 0 = Sunday. */
export function firstWeekday(year: number, month: number) {
  return new Date(Date.UTC(year, month - 1, 1)).getUTCDay()
}

/** Builds a day from parts, zero-padded. Returns "" when the parts are not a real date. */
export function makeDay(year: number, month: number, dayOfMonth: number): Day {
  const candidate = `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(dayOfMonth).padStart(2, "0")}`
  return isDay(candidate) ? candidate : ""
}

/** The year/month/day a day string names. Null when it is not a real date. */
export function dayParts(day: Day) {
  if (!isDay(day)) return null
  const date = dayToDate(day)
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    dayOfMonth: date.getUTCDate(),
  }
}
