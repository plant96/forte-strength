import "server-only"

import { unstable_rethrow } from "next/navigation"

import type { TdeeFormInput } from "@/features/tdee/schema"
import { getCurrentUser } from "@/server/auth"

import { profileRecordToTdeeFormInput } from "./mappers"

/** Calculator values from the signed-in user's profile, or undefined when there's nothing to fill. */
export async function getCalculatorAutofill(): Promise<TdeeFormInput | undefined> {
  try {
    const user = await getCurrentUser()
    return user?.profile ? profileRecordToTdeeFormInput(user.profile) : undefined
  } catch (error) {
    unstable_rethrow(error)
    console.error("[profile] Could not load autofill values:", error)
    return undefined
  }
}
