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

/** "Aug 12, 2026" */
export function formatDay(day: Day) {
  return dayFormat.format(dayToDate(day))
}

/** "Aug 12" — for axis ticks, where the year is carried by the axis as a whole. */
export function formatDayShort(day: Day) {
  return shortDayFormat.format(dayToDate(day))
}

/** Whole days between two days, positive when `b` is later. */
export function daysBetween(a: Day, b: Day) {
  return Math.round((dayToDate(b).getTime() - dayToDate(a).getTime()) / 86_400_000)
}

/** "today", "yesterday", "3 days ago", "5 weeks ago", then a plain date past a year. */
export function describeDay(day: Day, now: Day = today()) {
  const diff = daysBetween(day, now)
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
