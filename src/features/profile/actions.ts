"use server"

import { clerkClient } from "@clerk/nextjs/server"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { after } from "next/server"

import { notifyProfileCompleted } from "@/features/notifications/notify"
import { isLockedToOnboarding, requireUser } from "@/server/auth"
import { db } from "@/server/db"

import { profileValuesToRecord, WEIGHT_UNIT_TO_DB } from "./mappers"
import { nameSchema, profileFormSchema, type NameFormInput, type ProfileFormInput } from "./schema"

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
        data: {
          onboardedAt: user.onboardedAt ?? new Date(),
          // A preference rather than a body stat, so it lives on the account — someone
          // who skips onboarding entirely still needs one for the PR tracker.
          liftUnit: WEIGHT_UNIT_TO_DB[parsed.data.liftUnit],
        },
      }),
    ])
  } catch (error) {
    console.error("[profile] Could not save profile:", error)
    return { ok: false, message: "We couldn't save your profile. Please try again." }
  }

  // Only the first save completes onboarding; later edits are just edits.
  if (!user.onboardedAt) after(() => notifyProfileCompleted(user))

  revalidatePath("/", "layout")
  return { ok: true }
}

export type SaveNameResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Partial<Record<keyof NameFormInput, string>> }

/**
 * Saves the signed-in user's first and last name. The database is the source of truth;
 * Clerk is updated afterwards so their account page agrees, but a Clerk hiccup never
 * fails the save.
 */
export async function saveName(input: NameFormInput): Promise<SaveNameResult> {
  const user = await requireUser()

  const parsed = nameSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Partial<Record<keyof NameFormInput, string>> = {}
    for (const issue of parsed.error.issues) {
      const field = issue.path[0] as keyof NameFormInput | undefined
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { ok: false, message: "Both names are needed.", fieldErrors }
  }

  try {
    await db.user.update({ where: { id: user.id }, data: parsed.data })
  } catch (error) {
    console.error("[profile] Could not save name:", error)
    return { ok: false, message: "We couldn't save your name. Please try again." }
  }

  // Resolved before `after`, because the client reads request context to build itself.
  const clerk = await clerkClient()
  after(() =>
    clerk.users.updateUser(user.clerkId, parsed.data).catch((error: unknown) => {
      console.error("[profile] Could not mirror the name to Clerk:", error)
    }),
  )

  revalidatePath("/", "layout")
  return { ok: true }
}

/**
 * Lets a new user skip onboarding for now; a banner reminds them later. Refused for
 * accounts that signed up through the onboarding-required link — the button is hidden
 * for them, but the action is a POST anyone can send.
 */
export async function skipOnboarding() {
  const user = await requireUser()
  if (isLockedToOnboarding(user)) redirect("/onboarding")

  await db.user.update({
    where: { id: user.id },
    data: { onboardingSkippedAt: new Date() },
  })
  redirect("/")
}
