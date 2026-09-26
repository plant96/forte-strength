"use client"

import { useAuth } from "@clerk/nextjs"
import { redirect, usePathname } from "next/navigation"

/** Where an account that must finish onboarding is still allowed to be. */
export const LOCK_ALLOWED_PATHS = [
  "/onboarding",
  "/sign-in",
  "/sign-up",
  // Legal pages stay reachable: the consent and sign-up flows link to them.
  "/privacy",
  "/terms",
] as const

export function isAllowedWhileLocked(pathname: string) {
  return LOCK_ALLOWED_PATHS.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

/**
 * Confines an account that signed up through `/sign-up?onboarding=required` to the
 * wizard until it is finished.
 *
 * A client component on purpose: layouts don't re-render on client-side navigation, so
 * a server-side check in the root layout would only catch full page loads. This one
 * re-evaluates on every route change through `usePathname`, and `redirect` is allowed
 * during a client render — it becomes a real redirect on the server and a router
 * navigation on the client. The `isSignedIn` guard covers the moment right after
 * sign-out, when `locked` may still be the last value the server computed.
 */
export function OnboardingLock({
  locked,
  children,
}: {
  locked: boolean
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const { isSignedIn } = useAuth()

  if (locked && isSignedIn !== false && !isAllowedWhileLocked(pathname)) redirect("/onboarding")
  return children
}
