/**
 * Every date and time in the admin panel is the coach's local clock (Orlando, FL).
 *
 * The IANA zone, not a fixed offset, so the switch between EST and EDT happens on the right
 * weekend by itself. Analytics reads this too — it used to carry its own configurable zone,
 * which quietly defaulted to UTC while the docs promised Eastern.
 */
export const ADMIN_TIME_ZONE = "America/New_York"

// `dateStyle`/`timeStyle` cannot be combined with `timeZoneName`, so the parts are spelled
// out. The zone name is rendered rather than hardcoded: half the year it is EDT, not EST,
// and a label that says otherwise is worse than none.
const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: ADMIN_TIME_ZONE,
  timeZoneName: "short",
})
const dateFormat = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: ADMIN_TIME_ZONE,
})
const relativeFormat = new Intl.RelativeTimeFormat("en-US", { numeric: "auto" })

export function formatDateTime(date: Date) {
  return dateTimeFormat.format(date)
}

/** "Eastern Daylight Time" — how a person says the zone, DST and all. */
export function timeZoneLabel(date: Date = new Date(), timeZone: string = ADMIN_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    timeZoneName: "long",
  }).formatToParts(date)
  return parts.find((part) => part.type === "timeZoneName")?.value ?? timeZone
}

/**
 * A whole hour as a clock reading: 0 -> "12am", 13 -> "1pm".
 *
 * Nothing in the panel shows 24-hour time, and an hour axis reading 0/6/12/18 was the last
 * place it survived.
 */
export function formatHour(hour: number) {
  const period = hour < 12 ? "am" : "pm"
  const clock = hour % 12 === 0 ? 12 : hour % 12
  return `${clock}${period}`
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
