"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { requireUser } from "@/server/auth"
import { db } from "@/server/db"

import { profileValuesToRecord } from "./mappers"
import { profileFormSchema, type ProfileFormInput } from "./schema"

export type SaveProfileResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Partial<Record<keyof ProfileFormInput, string>> }

/** Saves the signed-in user's profile. The first save also completes onboarding. */
export async function saveProfile(input: ProfileFormInput): Promise<SaveProfileResult> {
  const user = await requireUser()

  const parsed = profileFormSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof ProfileFormInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof ProfileFormInput | undefined
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { ok: false, message: "Some fields need another look.", fieldErrors }
  }

  const record = profileValuesToRecord(parsed.data)
  try {
    await db.$transaction([
      db.profile.upsert({
        where: { userId: user.id },
        create: { userId: user.id, ...record },
        update: record,
      }),
      db.user.update({
        where: { id: user.id },
        data: { onboardedAt: user.onboardedAt ?? new Date() },
      }),
    ])
  } catch (error) {
    console.error("[profile] Could not save profile:", error)
    return { ok: false, message: "We couldn't save your profile. Please try again." }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

/** Lets a new user skip onboarding for now; a banner reminds them later. */
export async function skipOnboarding() {
  const user = await requireUser()
  await db.user.update({
    where: { id: user.id },
    data: { onboardingSkippedAt: new Date() },
  })
  redirect("/")
}
