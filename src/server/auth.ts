import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { after } from "next/server"
import { cache } from "react"

import { onUserCreated } from "@/features/notifications/notify"

import { db } from "./db"

function primaryEmail(clerkUser: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return (
    clerkUser.primaryEmailAddress?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? ""
  )
}

/**
 * The signed-in user's database record (with their profile), or null when signed out.
 * The record is created from Clerk the first time we see someone. Deduplicated per request.
 */
export const getCurrentUser = cache(async () => {
  const { userId } = await auth()
  if (!userId) return null

  const existing = await db.user.findUnique({
    where: { clerkId: userId },
    include: { profile: true },
  })
  if (existing) return existing

  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const created = await db.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email: primaryEmail(clerkUser),
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
      // Stamped by the sign-up page when they arrived via /sign-up?onboarding=required.
      onboardingRequired: clerkUser.unsafeMetadata?.onboardingRequired === true,
    },
    include: { profile: true },
  })

  // First sight of this account: tell the coach, after the response has gone out.
  after(() => onUserCreated(created))
  return created
})

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

/** Refreshes the stored name, email and avatar from Clerk (e.g. after they edit their account). */
export async function syncCurrentUser(user: CurrentUser) {
  const clerkUser = await currentUser()
  if (!clerkUser) return user

  const next = {
    email: primaryEmail(clerkUser),
    // Names can be set here without Clerk knowing (the onboarding name step mirrors them
    // best-effort), so an empty Clerk name never erases one we already have.
    firstName: clerkUser.firstName?.trim() ? clerkUser.firstName : user.firstName,
    lastName: clerkUser.lastName?.trim() ? clerkUser.lastName : user.lastName,
    imageUrl: clerkUser.imageUrl,
  }
  const changed =
    next.email !== user.email ||
    next.firstName !== user.firstName ||
    next.lastName !== user.lastName ||
    next.imageUrl !== user.imageUrl
  if (!changed) return user

  return db.user.update({ where: { id: user.id }, data: next, include: { profile: true } })
}

/** The signed-in user, or a redirect to sign-in. */
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect("/sign-in")
  return user
}

/** The signed-in admin. Anyone else gets a 404, so the admin panel's existence isn't revealed. */
export async function requireAdmin() {
  const user = await getCurrentUser()
  if (!user || user.role !== "ADMIN") notFound()
  return user
}

export function isAdmin(user: { role: string } | null | undefined) {
  return user?.role === "ADMIN"
}

/** True once the coach has marked the account as a coaching client. */
export function isClient(user: { clientSince: Date | null } | null | undefined) {
  return user?.clientSince != null
}

/**
 * True while an account that signed up through `/sign-up?onboarding=required` still
 * hasn't finished the wizard. The site is confined to `/onboarding` until then.
 */
export function isLockedToOnboarding(
  user: { onboardingRequired: boolean; onboardedAt: Date | null } | null | undefined,
) {
  return Boolean(user?.onboardingRequired && !user.onboardedAt)
}

/**
 * Who may use the client-only areas (the PR tracker, the mobility vault): coaching
 * clients, and admins so the coach can see what their clients see.
 */
export function canAccessClientArea(
  user: { role: string; clientSince: Date | null } | null | undefined,
) {
  return isAdmin(user) || isClient(user)
}

/** Whether the caller may see client-only content at all. */
export async function hasClientAreaAccess() {
  return canAccessClientArea(await getCurrentUser())
}

/**
 * The signed-in user when they may use client-only areas, otherwise null.
 *
 * Pages use this to render an upsell instead of the real content — deliberately not a
 * redirect, because bouncing a curious visitor to sign-in throws away the pitch. Server
 * actions and privileged queries call it too: they are reachable by direct POST, so the
 * page-level gate is never the only barrier.
 */
export async function getClientAreaUser() {
  const user = await getCurrentUser()
  return canAccessClientArea(user) ? user : null
}
