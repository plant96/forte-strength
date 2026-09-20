/** Categorical series colours, in fixed slot order. Never cycle past the end. */
export const SERIES = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
  "var(--chart-6)",
  "var(--chart-7)",
  "var(--chart-8)",
] as const

/** Sequential ramp for magnitude, dimmest to brightest. */
export const SCALE = [
  "var(--scale-1)",
  "var(--scale-2)",
  "var(--scale-3)",
  "var(--scale-4)",
  "var(--scale-5)",
  "var(--scale-6)",
] as const

export const compact = new Intl.NumberFormat("en-US", { notation: "compact" })
export const full = new Intl.NumberFormat("en-US")

/** Keep every chart and visit timestamp in the same configured display zone. */
export function analyticsTimezone(value: string | undefined) {
  const timezone = value?.trim() || "UTC"
  try {
    return new Intl.DateTimeFormat("en-US", { timeZone: timezone }).resolvedOptions().timeZone
  } catch {
    return "UTC"
  }
}

export function formatTrafficTime(
  value: string,
  range: "24h" | "7d" | "30d" | "90d" | "12mo",
  timezone: string,
  detailed = false,
) {
  const options: Intl.DateTimeFormatOptions = { timeZone: timezone }
  if (range === "24h") {
    options.hour = "numeric"
    options.minute = "2-digit"
    if (detailed) {
      options.weekday = "short"
      options.timeZoneName = "short"
    }
  } else if (range === "12mo") {
    options.month = detailed ? "long" : "short"
    if (detailed) options.year = "numeric"
  } else {
    options.month = "short"
    options.day = "numeric"
    if (detailed) options.weekday = "short"
  }
  return new Date(value).toLocaleString("en-US", options)
}

export function formatDuration(ms: number) {
  if (!ms) return "0s"
  const seconds = Math.round(ms / 1000)
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes < 60) return rest ? `${minutes}m ${rest}s` : `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export function formatPercent(fraction: number, digits = 1) {
  return `${(fraction * 100).toFixed(digits)}%`
}

/** Period-over-period change. Returns null when there's no baseline to compare against. */
export function delta(current: number, previous: number) {
  if (!previous) return null
  return (current - previous) / previous
}

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const

/** Two-letter ISO code to its flag emoji, via the regional indicator block. */
export function countryFlag(code: string | null | undefined) {
  if (!code || code.length !== 2 || !/^[a-z]{2}$/i.test(code)) return "🏳️"
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map((char) => 0x1f1e6 - 65 + char.charCodeAt(0)),
  )
}

const REGION_NAMES =
  typeof Intl.DisplayNames === "function" ? new Intl.DisplayNames(["en"], { type: "region" }) : null

export function countryName(code: string | null | undefined) {
  if (!code || code.length !== 2) return code || "Unknown"
  try {
    return REGION_NAMES?.of(code.toUpperCase()) ?? code
  } catch {
    return code
  }
}
