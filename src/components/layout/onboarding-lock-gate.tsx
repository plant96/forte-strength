import { unstable_rethrow } from "next/navigation"

import { getCurrentUser, isLockedToOnboarding } from "@/server/auth"

import { OnboardingLock } from "./onboarding-lock"

/** Decides on the server whether the signed-in account is confined to `/onboarding`. */
export async function OnboardingLockGate({ children }: { children: React.ReactNode }) {
  let locked = false
  try {
    locked = isLockedToOnboarding(await getCurrentUser())
  } catch (error) {
    unstable_rethrow(error)
    // Unlocked is the safe failure: the wizard re-checks the account itself.
  }
  return <OnboardingLock locked={locked}>{children}</OnboardingLock>
}
