import "server-only"

import { db } from "@/server/db"

import { RETENTION_DAYS } from "./lib/config"

const DAY_MS = 24 * 60 * 60 * 1000
const RETRY_MS = 5 * 60 * 1000

export function retentionCutoff(now = Date.now()) {
  return new Date(now - RETENTION_DAYS * DAY_MS)
}

/** Internal cleanup shared by the authenticated cron and admin action. */
export async function purgeExpiredVisits() {
  return db.pageView.deleteMany({ where: { createdAt: { lt: retentionCutoff() } } })
}

let nextCleanupAt = 0
let cleanup: Promise<void> | null = null

/**
 * Traffic-triggered fallback for hosts without a scheduler. Called in after(),
 * at most daily per warm process. The cron also cleans up when the site is idle.
 */
export async function maybePurgeExpiredVisits() {
  if (cleanup) return cleanup
  if (Date.now() < nextCleanupAt) return

  cleanup = (async () => {
    try {
      await purgeExpiredVisits()
      nextCleanupAt = Date.now() + DAY_MS
    } catch (error) {
      nextCleanupAt = Date.now() + RETRY_MS
      console.error("[analytics] Automatic retention cleanup failed:", error)
    }
  })()

  try {
    await cleanup
  } finally {
    cleanup = null
  }
}
