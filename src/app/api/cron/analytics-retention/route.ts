import { NextResponse } from "next/server"

import { purgeExpiredVisits } from "@/features/analytics/retention"

/** Vercel Cron or an external scheduler; never exposed as a public purge action. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const headers = { "Cache-Control": "no-store" }
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
  }

  try {
    const { count } = await purgeExpiredVisits()
    return NextResponse.json({ ok: true, deleted: count }, { headers })
  } catch (error) {
    console.error("[analytics] Scheduled retention cleanup failed:", error)
    return NextResponse.json({ error: "Cleanup failed" }, { status: 500, headers })
  }
}
