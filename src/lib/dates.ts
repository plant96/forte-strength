/** Admin dates are shown in the coach's time zone (Orlando, FL). */
export const ADMIN_TIME_ZONE = "America/New_York"

const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: ADMIN_TIME_ZONE,
})
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: ADMIN_TIME_ZONE,
})
const relativeFormat = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" })

export function formatDateTime(date: Date) {
  return `${dateTimeFormat.format(date)} ET`
}

export function formatDate(date: Date) {
  return dateFormat.format(date)
}

/** "just now", "5 minutes ago", "yesterday", "3 days ago", then a date after a week. */
export function formatRelative(date: Date, now: Date = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const abs = Math.abs(seconds)
  if (abs < 60) return "just now"
  if (abs < 3600) return relativeFormat.format(Math.round(seconds / 60), "minute")
  if (abs < 86_400) return relativeFormat.format(Math.round(seconds / 3600), "hour")
  if (abs < 7 * 86_400) return relativeFormat.format(Math.round(seconds / 86_400), "day")
  return formatDate(date)
}
