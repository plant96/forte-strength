import "server-only"

import { auth, currentUser } from "@clerk/nextjs/server"
import { notFound, redirect } from "next/navigation"
import { cache } from "react"

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

  return db.user.upsert({
    where: { clerkId: userId },
    update: {},
    create: {
      clerkId: userId,
      email: primaryEmail(clerkUser),
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
    include: { profile: true },
  })
})

export type CurrentUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>

/** Refreshes the stored name, email and avatar from Clerk (e.g. after they edit their account). */
export async function syncCurrentUser(user: CurrentUser) {
  const clerkUser = await currentUser()
  if (!clerkUser) return user

  const next = {
    email: primaryEmail(clerkUser),
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
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
