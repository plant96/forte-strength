import "server-only"

import { unstable_rethrow } from "next/navigation"

import type { AccountState } from "@/components/account/account-nudge"
import type { WeightUnit } from "@/lib/units"
import { canAccessClientArea, getCurrentUser, isClient } from "@/server/auth"

import { WEIGHT_UNIT_FROM_DB, type ProfileRecord } from "./mappers"

/** Everything a public page needs to know about who's looking, in one request-cached read. */
export interface Viewer {
  /** The database user id, for per-user reads like the PR tracker. Null when signed out. */
  id: string | null
  accountState: AccountState
  /** A coaching client. Coaching CTAs are hidden from them. */
  client: boolean
  /** May use the client-only areas (clients and admins), so PR tracker data may exist. */
  unlocked: boolean
  profile: ProfileRecord | null
  /** The unit they read gym weights in. Defaults to lb. */
  liftUnit: WeightUnit
}

const SIGNED_OUT: Viewer = {
  id: null,
  accountState: "signed-out",
  client: false,
  unlocked: false,
  profile: null,
  liftUnit: "lb",
}

/**
 * The current viewer. Falls back to a signed-out viewer if the lookup fails, so a database
 * hiccup degrades a public tool to "no autofill" rather than an error page.
 */
export async function getViewer(): Promise<Viewer> {
  try {
    const user = await getCurrentUser()
    if (!user) return SIGNED_OUT
    return {
      id: user.id,
      accountState: user.profile ? "complete" : "needs-profile",
      client: isClient(user),
      unlocked: canAccessClientArea(user),
      profile: user.profile,
      liftUnit: WEIGHT_UNIT_FROM_DB[user.liftUnit],
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error("[profile] Could not load the viewer:", error)
    return SIGNED_OUT
  }
}
