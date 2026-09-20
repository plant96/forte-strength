"use server"

import { revalidatePath } from "next/cache"

import { requireAdmin } from "@/server/auth"
import { db } from "@/server/db"

import { RETENTION_DAYS } from "./lib/config"
import { purgeExpiredVisits, retentionCutoff } from "./retention"

export type AnalyticsActionResult = { ok: true; message: string } | { ok: false; message: string }

/** How many rows are past the retention window right now. */
export async function countExpiredPageViews() {
  await requireAdmin()
  return db.pageView.count({ where: { createdAt: { lt: retentionCutoff() } } })
}

/**
 * Runs the same retention cleanup as the automatic job, on an admin's request.
 */
export async function purgeExpiredPageViews(): Promise<AnalyticsActionResult> {
  await requireAdmin()
  try {
    const { count } = await purgeExpiredVisits()
    revalidatePath("/admin/analytics")
    return {
      ok: true,
      message:
        count === 0
          ? `Nothing to purge — no visits are older than ${RETENTION_DAYS} days.`
          : `Purged ${count.toLocaleString()} visit${count === 1 ? "" : "s"} older than ${RETENTION_DAYS} days.`,
    }
  } catch (error) {
    console.error("[analytics] Could not purge expired page views:", error)
    return { ok: false, message: "Couldn't purge old visits. Check the server logs." }
  }
}

/** Removes every stored IP address while keeping the traffic history intact. */
export async function forgetAllIpAddresses(): Promise<AnalyticsActionResult> {
  await requireAdmin()
  try {
    const { count } = await db.pageView.updateMany({
      where: { ipAddress: { not: null } },
      data: { ipAddress: null },
    })
    revalidatePath("/admin/analytics")
    return {
      ok: true,
      message: `Cleared ${count.toLocaleString()} IP address${count === 1 ? "" : "es"}. Counts and locations are unchanged.`,
    }
  } catch (error) {
    console.error("[analytics] Could not clear IP addresses:", error)
    return { ok: false, message: "Couldn't clear the stored IP addresses." }
  }
}
