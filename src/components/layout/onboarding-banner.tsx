import { unstable_rethrow } from "next/navigation"

import { getCurrentUser } from "@/server/auth"

import { OnboardingBannerView } from "./onboarding-banner-view"

/** Reminds signed-in users who haven't finished onboarding to set up their profile. */
export async function OnboardingBanner() {
  let show = false
  try {
    const user = await getCurrentUser()
    show = Boolean(user && !user.onboardedAt)
  } catch (error) {
    unstable_rethrow(error)
    // Header already logs database errors; just skip the banner.
  }
  return show ? <OnboardingBannerView /> : null
}
