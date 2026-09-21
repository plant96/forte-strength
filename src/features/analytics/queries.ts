import "server-only"

import { Prisma } from "@/generated/prisma/client"
import { db } from "@/server/db"
import { requireAdmin } from "@/server/auth"

import { ADMIN_TIME_ZONE } from "@/lib/dates"

import { LIVE_WINDOW_MINUTES } from "./lib/config"

/**
 * Buckets, hour-of-day and log rows are all computed in the coach's zone, so "9am" means
 * 9am where they are. One zone for the whole panel — see `ADMIN_TIME_ZONE`.
 */
export const DISPLAY_TIMEZONE = ADMIN_TIME_ZONE

export const RANGES = {
  "24h": { label: "24 hours", hours: 24, unit: "hour", step: "1 hour" },
  "7d": { label: "7 days", hours: 24 * 7, unit: "day", step: "1 day" },
  "30d": { label: "30 days", hours: 24 * 30, unit: "day", step: "1 day" },
  "90d": { label: "90 days", hours: 24 * 90, unit: "day", step: "1 day" },
  "12mo": { label: "12 months", hours: 24 * 365, unit: "month", step: "1 month" },
} as const

export type RangeKey = keyof typeof RANGES

export function isRangeKey(value: string | undefined): value is RangeKey {
  return value !== undefined && Object.hasOwn(RANGES, value)
}

export function rangeWindow(range: RangeKey, to = new Date()) {
  const { hours } = RANGES[range]
  const from = new Date(to.getTime() - hours * 60 * 60 * 1000)
  // The same length again, immediately before, for period-over-period deltas.
  const previousFrom = new Date(from.getTime() - hours * 60 * 60 * 1000)
  return { from, to, previousFrom }
}

/** Bots are recorded but kept out of every headline number unless asked for. */
function scope(from: Date, to: Date, includeBots: boolean) {
  return Prisma.sql`
    "createdAt" >= ${from} AND "createdAt" < ${to}
    ${includeBots ? Prisma.empty : Prisma.sql`AND "isBot" = false`}
  `
}

export interface Totals {
  views: number
  visitors: number
  sessions: number
  avgDurationMs: number
  bounceRate: number
  viewsPerSession: number
}

async function totals(from: Date, to: Date, includeBots: boolean): Promise<Totals> {
  const [row] = await db.$queryRaw<
    {
      views: number
      visitors: number
      sessions: number
      avgDurationMs: number
      bounced: number
    }[]
  >(Prisma.sql`
    WITH scoped AS (
      SELECT "visitorId", "sessionId", "durationMs"
      FROM "PageView" WHERE ${scope(from, to, includeBots)}
    ),
    per_session AS (
      SELECT "sessionId", COUNT(*) AS views FROM scoped GROUP BY "sessionId"
    )
    SELECT
      (SELECT COUNT(*) FROM scoped)::int AS "views",
      (SELECT COUNT(DISTINCT "visitorId") FROM scoped)::int AS "visitors",
      (SELECT COUNT(*) FROM per_session)::int AS "sessions",
      (SELECT COALESCE(AVG("durationMs"), 0) FROM scoped WHERE "durationMs" IS NOT NULL)::int
        AS "avgDurationMs",
      (SELECT COUNT(*) FROM per_session WHERE views = 1)::int AS "bounced"
  `)

  const sessions = row?.sessions ?? 0
  return {
    views: row?.views ?? 0,
    visitors: row?.visitors ?? 0,
    sessions,
    avgDurationMs: row?.avgDurationMs ?? 0,
    bounceRate: sessions > 0 ? (row?.bounced ?? 0) / sessions : 0,
    viewsPerSession: sessions > 0 ? (row?.views ?? 0) / sessions : 0,
  }
}

/** A gap-free series — days with no traffic must plot as zero, not vanish. */
async function series(from: Date, to: Date, range: RangeKey, includeBots: boolean) {
  const { unit, step } = RANGES[range]
  // Hourly buckets are actual instants: the repeated fall-back hour stays two
  // separate points and spring-forward never gains a fictitious empty hour.
  if (unit === "hour") {
    const origin = Prisma.sql`(date_trunc('day', ${from}::timestamptz AT TIME ZONE ${DISPLAY_TIMEZONE}) AT TIME ZONE ${DISPLAY_TIMEZONE})`
    return db.$queryRaw<{ bucket: Date; views: number; visitors: number }[]>(Prisma.sql`
      WITH buckets AS (
        SELECT generate_series(
          date_bin('1 hour', ${from}::timestamptz, ${origin}),
          date_bin('1 hour', ${to}::timestamptz - interval '1 millisecond', ${origin}),
          interval '1 hour'
        ) AS bucket
      ),
      counted AS (
        SELECT date_bin('1 hour', "createdAt", ${origin}) AS bucket,
               COUNT(*)::int AS views, COUNT(DISTINCT "visitorId")::int AS visitors
        FROM "PageView" WHERE ${scope(from, to, includeBots)} GROUP BY 1
      )
      SELECT b.bucket, COALESCE(c.views, 0)::int AS views,
             COALESCE(c.visitors, 0)::int AS visitors
      FROM buckets b LEFT JOIN counted c ON c.bucket = b.bucket ORDER BY b.bucket
    `)
  }
  return db.$queryRaw<{ bucket: Date; views: number; visitors: number }[]>(Prisma.sql`
    WITH buckets AS (
      SELECT generate_series(
        date_trunc(${Prisma.raw(`'${unit}'`)}, ${from}::timestamptz AT TIME ZONE ${DISPLAY_TIMEZONE}),
        date_trunc(${Prisma.raw(`'${unit}'`)}, (${to}::timestamptz - interval '1 millisecond') AT TIME ZONE ${DISPLAY_TIMEZONE}),
        ${Prisma.raw(`'${step}'`)}::interval
      ) AS bucket
    ),
    counted AS (
      SELECT
        date_trunc(${Prisma.raw(`'${unit}'`)}, "createdAt" AT TIME ZONE ${DISPLAY_TIMEZONE}) AS bucket,
        COUNT(*)::int AS views,
        COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "PageView" WHERE ${scope(from, to, includeBots)}
      GROUP BY 1
    )
    SELECT b.bucket AT TIME ZONE ${DISPLAY_TIMEZONE} AS bucket,
           COALESCE(c.views, 0)::int AS views,
           COALESCE(c.visitors, 0)::int AS visitors
    FROM buckets b LEFT JOIN counted c ON c.bucket = b.bucket
    ORDER BY b.bucket
  `)
}

export interface Breakdown {
  label: string
  views: number
  visitors: number
}

/** Top values of one column. The column name is fixed by the caller, never user input. */
function breakdown(
  column: string,
  from: Date,
  to: Date,
  includeBots: boolean,
  limit = 10,
  fallback = "Unknown",
) {
  return db.$queryRaw<Breakdown[]>(Prisma.sql`
    SELECT
      COALESCE(NULLIF(${Prisma.raw(`"${column}"`)}::text, ''), ${fallback}) AS label,
      COUNT(*)::int AS views,
      COUNT(DISTINCT "visitorId")::int AS visitors
    FROM "PageView" WHERE ${scope(from, to, includeBots)}
    GROUP BY 1 ORDER BY views DESC, label ASC LIMIT ${limit}
  `)
}

export async function getAnalytics(
  range: RangeKey,
  includeBots = false,
  window = rangeWindow(range),
) {
  await requireAdmin()
  const { from, to, previousFrom } = window
  const live = new Date(to.getTime() - LIVE_WINDOW_MINUTES * 60 * 1000)

  const [
    current,
    previous,
    traffic,
    pages,
    entryPages,
    referrers,
    countries,
    cities,
    devices,
    browsers,
    operatingSystems,
    languages,
    campaigns,
    heatmap,
    mapPoints,
    liveRows,
    newReturning,
    botSplit,
  ] = await Promise.all([
    totals(from, to, includeBots),
    totals(previousFrom, from, includeBots),
    series(from, to, range, includeBots),
    breakdown("path", from, to, includeBots, 12),
    db.$queryRaw<Breakdown[]>(Prisma.sql`
      SELECT "path" AS label, COUNT(*)::int AS views,
             COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "PageView"
      WHERE ${scope(from, to, includeBots)} AND "isEntry" = true
      GROUP BY 1 ORDER BY views DESC LIMIT 10
    `),
    breakdown("referrerHost", from, to, includeBots, 10, "Direct / none"),
    breakdown("country", from, to, includeBots, 12),
    db.$queryRaw<Breakdown[]>(Prisma.sql`
      SELECT CONCAT_WS(', ', NULLIF("city", ''), NULLIF("country", '')) AS label,
             COUNT(*)::int AS views, COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "PageView"
      WHERE ${scope(from, to, includeBots)} AND "city" IS NOT NULL AND "city" <> ''
      GROUP BY 1 ORDER BY views DESC LIMIT 12
    `),
    breakdown("device", from, to, includeBots, 6),
    breakdown("browser", from, to, includeBots, 8),
    breakdown("os", from, to, includeBots, 8),
    breakdown("language", from, to, includeBots, 8),
    breakdown("utmSource", from, to, includeBots, 8, "None"),
    db.$queryRaw<{ weekday: number; hour: number; views: number }[]>(Prisma.sql`
      SELECT
        EXTRACT(DOW FROM "createdAt" AT TIME ZONE ${DISPLAY_TIMEZONE})::int AS weekday,
        EXTRACT(HOUR FROM "createdAt" AT TIME ZONE ${DISPLAY_TIMEZONE})::int AS hour,
        COUNT(*)::int AS views
      FROM "PageView" WHERE ${scope(from, to, includeBots)}
      GROUP BY 1, 2
    `),
    db.$queryRaw<
      {
        latitude: number
        longitude: number
        city: string | null
        country: string | null
        views: number
      }[]
    >(
      Prisma.sql`
        SELECT "latitude", "longitude",
               MAX("city") AS city, MAX("country") AS country,
               COUNT(*)::int AS views
        FROM "PageView"
        WHERE ${scope(from, to, includeBots)}
          AND "latitude" IS NOT NULL AND "longitude" IS NOT NULL
        GROUP BY "latitude", "longitude"
        ORDER BY views DESC LIMIT 500
      `,
    ),
    db.$queryRaw<{ visitors: number; views: number }[]>(Prisma.sql`
      SELECT COUNT(DISTINCT "visitorId")::int AS visitors, COUNT(*)::int AS views
      FROM "PageView" WHERE ${scope(live, to, false)}
    `),
    db.$queryRaw<{ returning: number; fresh: number }[]>(Prisma.sql`
      WITH first_seen AS (
        SELECT "visitorId", MIN("createdAt") AS first_at
        FROM "PageView" WHERE "isBot" = false GROUP BY "visitorId"
      ),
      seen_now AS (
        SELECT DISTINCT "visitorId" FROM "PageView" WHERE ${scope(from, to, false)}
      )
      SELECT
        COUNT(*) FILTER (WHERE f.first_at < ${from})::int AS "returning",
        COUNT(*) FILTER (WHERE f.first_at >= ${from})::int AS "fresh"
      FROM seen_now s JOIN first_seen f ON f."visitorId" = s."visitorId"
    `),
    db.$queryRaw<{ bots: number; humans: number }[]>(Prisma.sql`
      SELECT COUNT(*) FILTER (WHERE "isBot")::int AS bots,
             COUNT(*) FILTER (WHERE NOT "isBot")::int AS humans
      FROM "PageView" WHERE "createdAt" >= ${from} AND "createdAt" < ${to}
    `),
  ])

  return {
    range,
    from,
    to,
    timezone: DISPLAY_TIMEZONE,
    current,
    previous,
    traffic,
    pages,
    entryPages,
    referrers,
    countries,
    cities,
    devices,
    browsers,
    operatingSystems,
    languages,
    campaigns,
    heatmap,
    mapPoints,
    live: liveRows[0] ?? { visitors: 0, views: 0 },
    newReturning: newReturning[0] ?? { returning: 0, fresh: 0 },
    botSplit: botSplit[0] ?? { bots: 0, humans: 0 },
  }
}

export type AnalyticsData = Awaited<ReturnType<typeof getAnalytics>>

export interface VisitorLogFilters {
  page: number
  perPage: number
  country?: string
  device?: string
  search?: string
  includeBots: boolean
}

/** The raw visit log — one row per page view, newest first. */
export async function getVisitorLog(
  range: RangeKey,
  filters: VisitorLogFilters,
  window = rangeWindow(range),
) {
  await requireAdmin()
  const { from, to } = window
  const conditions = [scope(from, to, filters.includeBots)]

  if (filters.country) conditions.push(Prisma.sql`"country" = ${filters.country}`)
  if (filters.device) conditions.push(Prisma.sql`"device"::text = ${filters.device}`)
  if (filters.search) {
    const like = `%${filters.search.slice(0, 100).replace(/[\\%_]/g, "\\$&")}%`
    conditions.push(Prisma.sql`(
      "ipAddress" ILIKE ${like} OR "city" ILIKE ${like} OR "path" ILIKE ${like}
      OR "country" ILIKE ${like} OR "referrerHost" ILIKE ${like} OR "browser" ILIKE ${like}
    )`)
  }

  const where = Prisma.join(conditions, " AND ")
  const perPage = Number.isSafeInteger(filters.perPage)
    ? Math.min(100, Math.max(1, filters.perPage))
    : 25
  const countRows = await db.$queryRaw<{ total: number }[]>(
    Prisma.sql`SELECT COUNT(*)::int AS total FROM "PageView" WHERE ${where}`,
  )
  const total = countRows[0]?.total ?? 0
  const pageCount = Math.max(1, Math.ceil(total / perPage))
  const page = Number.isSafeInteger(filters.page)
    ? Math.min(pageCount, Math.max(1, filters.page))
    : 1
  const skip = (page - 1) * perPage

  const rows = await db.$queryRaw<
    {
      id: string
      createdAt: Date
      visitorId: string
      sessionId: string
      ipAddress: string | null
      country: string | null
      region: string | null
      city: string | null
      timezone: string | null
      path: string
      referrerHost: string | null
      browser: string | null
      os: string | null
      device: string
      screenW: number | null
      screenH: number | null
      language: string | null
      durationMs: number | null
      isBot: boolean
      userId: string | null
    }[]
  >(Prisma.sql`
      SELECT "id", "createdAt", "visitorId", "sessionId", "ipAddress", "country", "region",
             "city", "timezone", "path", "referrerHost", "browser", "os", "device"::text AS device,
             "screenW", "screenH", "language", "durationMs", "isBot", "userId"
      FROM "PageView" WHERE ${where}
      ORDER BY "createdAt" DESC, "id" DESC LIMIT ${perPage} OFFSET ${skip}
    `)

  return { rows, total, page, pageCount }
}

export type VisitorLogRow = Awaited<ReturnType<typeof getVisitorLog>>["rows"][number]
