"use server"

import { revalidatePath } from "next/cache"

import { COACH_PROFILE_ID } from "@/features/coach/queries"
import { coachProfileSchema, type CoachProfileFormInput } from "@/features/coach/schema"
import { requireAdmin } from "@/server/auth"
import { db } from "@/server/db"

export type AdminActionResult = { ok: true } | { ok: false; message: string }

export async function setApplicationProcessed(
  id: string,
  processed: boolean,
): Promise<AdminActionResult> {
  await requireAdmin()
  try {
    await db.application.update({
      where: { id },
      data: processed
        ? { status: "PROCESSED", processedAt: new Date() }
        : { status: "UNPROCESSED", processedAt: null },
    })
  } catch (error) {
    console.error("[admin] Could not update application:", error)
    return { ok: false, message: "Couldn't update the application. It may have been deleted." }
  }
  revalidatePath("/admin", "layout")
  return { ok: true }
}

export async function deleteApplication(id: string): Promise<AdminActionResult> {
  await requireAdmin()
  try {
    await db.application.delete({ where: { id } })
  } catch (error) {
    console.error("[admin] Could not delete application:", error)
    return { ok: false, message: "Couldn't delete the application. It may already be gone." }
  }
  revalidatePath("/admin", "layout")
  return { ok: true }
}

/** Marks a website user as a coaching client (or takes that back). Admins can be clients too. */
export async function setUserClient(id: string, client: boolean): Promise<AdminActionResult> {
  await requireAdmin()
  try {
    await db.user.update({
      where: { id },
      data: { clientSince: client ? new Date() : null },
    })
  } catch (error) {
    console.error("[admin] Could not update user:", error)
    return { ok: false, message: "Couldn't update the user. They may have been deleted." }
  }
  revalidatePath("/admin", "layout")
  return { ok: true }
}

export type CoachProfileResult =
  | { ok: true }
  | {
      ok: false
      message: string
      fieldErrors?: Partial<Record<keyof CoachProfileFormInput, string>>
    }

export async function updateCoachProfile(
  input: CoachProfileFormInput,
): Promise<CoachProfileResult> {
  await requireAdmin()

  const parsed = coachProfileSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof CoachProfileFormInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof CoachProfileFormInput | undefined
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { ok: false, message: "Some fields need another look.", fieldErrors }
  }

  try {
    await db.coachProfile.upsert({
      where: { id: COACH_PROFILE_ID },
      create: { id: COACH_PROFILE_ID, ...parsed.data },
      update: parsed.data,
    })
  } catch (error) {
    console.error("[admin] Could not save coach profile:", error)
    return { ok: false, message: "Couldn't save the coach profile. Please try again." }
  }

  // The records and bio appear across the whole site.
  revalidatePath("/", "layout")
  return { ok: true }
}
