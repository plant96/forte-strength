import { after, NextResponse } from "next/server"
import { z } from "zod"

import {
  isExcludedPath,
  SESSION_COOKIE,
  SESSION_IDLE_MINUTES,
  VISITOR_COOKIE,
} from "@/features/analytics/lib/config"
import { clientIpFrom, resolveLocation } from "@/features/analytics/lib/geo"
import { maybePurgeExpiredVisits } from "@/features/analytics/retention"
import { isBotAgent, parseBrowser, parseDevice, parseOs } from "@/features/analytics/lib/user-agent"
import { checkOnlineMilestones, onNewVisitor } from "@/features/notifications/notify"
import { db } from "@/server/db"

/** A view, or the duration ping that closes one out. */
const payload = z.union([
  z.object({
    type: z.literal("view"),
    path: z
      .string()
      .min(1)
      .max(2048)
      .refine(
        (value) =>
          value.startsWith("/") && !value.startsWith("//") && !/[\\\u0000-\u001f]/.test(value),
      ),
    title: z.string().max(300).nullish(),
    referrer: z.string().max(2048).nullish(),
    screenW: z.number().int().positive().max(20000).nullish(),
    screenH: z.number().int().positive().max(20000).nullish(),
    viewportW: z.number().int().positive().max(20000).nullish(),
    viewportH: z.number().int().positive().max(20000).nullish(),
    language: z.string().max(35).nullish(),
    timezone: z.string().max(64).nullish(),
  }),
  z.object({
    type: z.literal("duration"),
    id: z.string().regex(/^[a-f0-9]{32}$/),
    // Capped at 6 hours: a backgrounded tab is not six hours of reading.
    durationMs: z
      .number()
      .int()
      .min(0)
      .max(6 * 60 * 60 * 1000),
  }),
])

function randomId() {
  return crypto.randomUUID().replaceAll("-", "")
}

/** Host only, so one referrer groups regardless of its query string. */
function hostOf(referrer: string | null | undefined, selfHost: string) {
  if (!referrer) return null
  try {
    const host = new URL(referrer).host.replace(/^www\./, "")
    // Our own pages are internal navigation, not a traffic source.
    return host && host !== selfHost.replace(/^www\./, "") ? host : null
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const headers = request.headers
  const requestUrl = new URL(request.url)
  const origin = headers.get("origin")
  if (headers.get("sec-fetch-site") === "cross-site" || (origin && origin !== requestUrl.origin)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 })
  }
  if (headers.get("content-type")?.split(";")[0].trim() !== "application/json") {
    return NextResponse.json({ error: "Expected JSON" }, { status: 415 })
  }

  let body: unknown
  try {
    const text = await request.text()
    if (text.length > 16_384) {
      return NextResponse.json({ error: "Payload too large" }, { status: 413 })
    }
    body = JSON.parse(text)
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = payload.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Invalid payload" }, { status: 400 })
  const data = parsed.data

  const cookieHeader = headers.get("cookie") ?? ""
  const readCookie = (name: string) => {
    const value = cookieHeader
      .split(";")
      .map((part) => part.trim())
      .find((part) => part.startsWith(`${name}=`))
      ?.slice(name.length + 1)
    return value && /^[a-f0-9]{32}$/.test(value) ? value : null
  }
  const existingVisitor = readCookie(VISITOR_COOKIE)

  if (data.type === "duration") {
    if (!existingVisitor) return new NextResponse(null, { status: 204 })
    // Keep the longest reading we saw: a tab can be hidden and revealed repeatedly.
    after(async () => {
      try {
        await db.$executeRaw`
          UPDATE "PageView"
          SET "durationMs" = ${data.durationMs}
          WHERE "id" = ${data.id}
            AND "visitorId" = ${existingVisitor}
            AND ("durationMs" IS NULL OR "durationMs" < ${data.durationMs})
        `
      } catch (error) {
        console.error("[analytics] Could not record view duration:", error)
      }
    })
    return new NextResponse(null, { status: 204 })
  }

  const pageUrl = new URL(data.path, requestUrl.origin)
  const path = pageUrl.pathname
  if (path.length > 512) return NextResponse.json({ error: "Path too long" }, { status: 400 })
  if (isExcludedPath(path)) return new NextResponse(null, { status: 204 })

  const userAgent = (headers.get("user-agent") ?? "").slice(0, 2048)
  const visitorId = existingVisitor ?? randomId()
  const existingSession = existingVisitor ? readCookie(SESSION_COOKIE) : null
  const sessionId = existingSession ?? randomId()
  const isEntry = !existingSession

  const ip = clientIpFrom(headers)
  const location = await resolveLocation(headers, ip)

  const id = randomId()
  const row = {
    id,
    visitorId,
    sessionId,
    isEntry,
    path,
    title: data.title ?? null,
    referrer: data.referrer ?? null,
    referrerHost: hostOf(data.referrer, requestUrl.host),
    utmSource: pageUrl.searchParams.get("utm_source")?.slice(0, 300) || null,
    utmMedium: pageUrl.searchParams.get("utm_medium")?.slice(0, 300) || null,
    utmCampaign: pageUrl.searchParams.get("utm_campaign")?.slice(0, 300) || null,
    ipAddress: ip,
    ...location,
    timezone: data.timezone ?? null,
    userAgent: userAgent || null,
    browser: parseBrowser(userAgent),
    os: parseOs(userAgent),
    device: parseDevice(userAgent, data.viewportW),
    screenW: data.screenW ?? null,
    screenH: data.screenH ?? null,
    viewportW: data.viewportW ?? null,
    viewportH: data.viewportH ?? null,
    language: data.language ?? null,
    isBot: isBotAgent(userAgent),
  }

  // Acknowledge only after insertion, so an immediate duration ping can find it.
  // The beacon is asynchronous and never blocks page rendering or navigation.
  try {
    await db.pageView.create({ data: row })
  } catch (error) {
    console.error("[analytics] Could not record page view:", error)
    return NextResponse.json({ error: "Could not record view" }, { status: 503 })
  }
  after(maybePurgeExpiredVisits)
  // Coach milestones, checked after the response. Both swallow their own errors.
  if (!row.isBot) {
    if (!existingVisitor) after(() => onNewVisitor(visitorId))
    after(checkOnlineMilestones)
  }

  const response = NextResponse.json({ id })
  const secure = requestUrl.protocol === "https:"
  const common = { httpOnly: true, sameSite: "lax", path: "/", secure } as const
  response.cookies.set(VISITOR_COOKIE, visitorId, { ...common, maxAge: 60 * 60 * 24 * 365 })
  response.cookies.set(SESSION_COOKIE, sessionId, {
    ...common,
    maxAge: SESSION_IDLE_MINUTES * 60,
  })
  return response
}
