import "server-only"

import { unstable_rethrow } from "next/navigation"
import { cache } from "react"

import { db } from "@/server/db"

import {
  NOTIFICATIONS,
  notificationDefault,
  type NotificationDefinition,
  type NotificationKey,
} from "./catalog"

export interface NotificationSetting extends NotificationDefinition {
  enabled: boolean
}

/** The catalogue with each entry's current on/off state. Deduplicated per request. */
export const getNotificationPreferences = cache(async (): Promise<NotificationSetting[]> => {
  const rows = await db.notificationPreference.findMany({ select: { key: true, enabled: true } })
  const stored = new Map(rows.map((row) => [row.key, row.enabled]))
  return NOTIFICATIONS.map((entry) => ({
    ...entry,
    enabled: stored.get(entry.key) ?? entry.defaultEnabled,
  }))
})

/**
 * Whether one notification is switched on. Safe to call from `after()` and cron
 * handlers: a database error reads as "off", so a flaky connection never spams the coach.
 */
export async function isNotificationEnabled(key: NotificationKey) {
  try {
    const row = await db.notificationPreference.findUnique({
      where: { key },
      select: { enabled: true },
    })
    return row?.enabled ?? notificationDefault(key)
  } catch (error) {
    unstable_rethrow(error)
    console.error(`[notifications] Could not read the "${key}" preference:`, error)
    return false
  }
}

/** Every milestone email that has gone out, newest first. */
export async function getReachedMilestones() {
  return db.notificationMilestone.findMany({ orderBy: { reachedAt: "desc" } })
}
