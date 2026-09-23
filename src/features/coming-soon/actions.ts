"use server"

import { revalidatePath } from "next/cache"

import type { AdminActionResult } from "@/features/admin/actions"
import { requireAdmin } from "@/server/auth"
import { db } from "@/server/db"

import { COMING_SOON_KIND_TO_DB, comingSoonSchema, type ComingSoonInput } from "./schema"

export async function addComingSoonItem(input: ComingSoonInput): Promise<AdminActionResult> {
  await requireAdmin()

  const parsed = comingSoonSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, message: parsed.error.issues[0]?.message ?? "Enter a title." }
  }

  try {
    await db.comingSoonItem.create({
      data: { kind: COMING_SOON_KIND_TO_DB[parsed.data.kind], title: parsed.data.title },
    })
  } catch (error) {
    console.error("[coming-soon] Could not add the item:", error)
    return { ok: false, message: "Couldn't add that. Please try again." }
  }

  // Teasers show in the header nav on every page and on the dashboard.
  revalidatePath("/", "layout")
  return { ok: true }
}

export async function removeComingSoonItem(id: string): Promise<AdminActionResult> {
  await requireAdmin()
  try {
    await db.comingSoonItem.delete({ where: { id } })
  } catch (error) {
    console.error("[coming-soon] Could not remove the item:", error)
    return { ok: false, message: "Couldn't remove that. It may already be gone." }
  }
  revalidatePath("/", "layout")
  return { ok: true }
}
