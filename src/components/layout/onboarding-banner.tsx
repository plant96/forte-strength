import { unstable_rethrow } from "next/navigation"

import { getCurrentUser, isLockedToOnboarding } from "@/server/auth"

import { OnboardingBannerView } from "./onboarding-banner-view"

/**
 * Reminds signed-in users who haven't finished onboarding to set up their profile.
 * Shown on every page except the wizard itself, every visit, until the profile is saved.
 * Accounts confined to the wizard never leave it, so they don't need the reminder.
 */
export async function OnboardingBanner() {
  let show = false
  try {
    const user = await getCurrentUser()
    show = Boolean(user && !user.onboardedAt && !isLockedToOnboarding(user))
  } catch (error) {
    unstable_rethrow(error)
    // Header already logs database errors; just skip the banner.
  }
  return show ? <OnboardingBannerView /> : null
}
