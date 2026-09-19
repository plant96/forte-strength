import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { OnboardingWizard } from "@/features/profile/components/onboarding-wizard"
import { requireUser } from "@/server/auth"

export const metadata: Metadata = { title: "Set up your profile", robots: { index: false } }

export default async function OnboardingPage() {
  const user = await requireUser()
  if (user.onboardedAt) redirect("/profile")

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <OnboardingWizard firstName={user.firstName} />
    </div>
  )
}
