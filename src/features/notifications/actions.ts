"use server"

import { revalidatePath } from "next/cache"

import type { AdminActionResult } from "@/features/admin/actions"
import { requireAdmin } from "@/server/auth"
import { db } from "@/server/db"

import { isNotificationKey } from "./catalog"

/** Switches one coach email on or off. */
export async function setNotificationEnabled(
  key: string,
  enabled: boolean,
): Promise<AdminActionResult> {
  await requireAdmin()
  if (!isNotificationKey(key)) return { ok: false, message: "That notification doesn't exist." }

  try {
    await db.notificationPreference.upsert({
      where: { key },
      create: { key, enabled },
      update: { enabled },
    })
  } catch (error) {
    console.error("[notifications] Could not save the preference:", error)
    return { ok: false, message: "Couldn't save that setting. Please try again." }
  }

  revalidatePath("/admin/notifications")
  return { ok: true }
}
