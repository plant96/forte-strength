/** Reject invalid values so a typo cannot erase all visits or disable cleanup. */
export function parseRetentionDays(value: string | undefined) {
  const days = Number(value)
  return Number.isInteger(days) && days >= 1 && days <= 3650 ? days : 90
}

/** How long raw visit rows — including IP addresses — are kept. */
export const RETENTION_DAYS = parseRetentionDays(process.env.ANALYTICS_RETENTION_DAYS)

/** A session ends after this much idle time, matching the usual analytics convention. */
export const SESSION_IDLE_MINUTES = 30

/** A visitor counts as "live" if they have been seen this recently. */
export const LIVE_WINDOW_MINUTES = 5

export const VISITOR_COOKIE = "fs_vid"
export const SESSION_COOKIE = "fs_sid"

/**
 * Paths never recorded. The admin panel is excluded so the coach browsing their
 * own dashboard doesn't show up as traffic.
 */
const EXCLUDED_PREFIXES = ["/admin", "/api", "/_next", "/sign-in", "/sign-up"]

export function isExcludedPath(path: string) {
  return EXCLUDED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * Optional geo-IP endpoint with an `{ip}` placeholder, e.g.
 * `https://ipapi.co/{ip}/json/`. Left unset, location comes only from the
 * hosting platform's own headers (Vercel sets these for free) — visitor IPs are
 * never sent to a third party unless you opt in by setting this.
 */
export const GEOIP_ENDPOINT = process.env.ANALYTICS_GEOIP_ENDPOINT?.trim() || null
