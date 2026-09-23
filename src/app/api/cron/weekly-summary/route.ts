import { NextResponse } from "next/server"

import { sendWeeklySummary } from "@/features/notifications/notify"

/** Vercel Cron (Monday mornings) or an external scheduler; never a public endpoint. */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  const headers = { "Cache-Control": "no-store" }
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers })
  }

  try {
    const sent = await sendWeeklySummary()
    return NextResponse.json({ ok: true, sent }, { headers })
  } catch (error) {
    console.error("[notifications] Weekly summary failed:", error)
    return NextResponse.json({ error: "Summary failed" }, { status: 500, headers })
  }
}
