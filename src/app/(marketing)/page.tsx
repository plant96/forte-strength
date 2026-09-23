import type { Metadata } from "next"
import { redirect, unstable_rethrow } from "next/navigation"

import { siteConfig } from "@/config/site"
import { getCoachProfile } from "@/features/coach/queries"
import { AboutCoach } from "@/features/landing/components/about-coach"
import { FinalCta } from "@/features/landing/components/final-cta"
import { Hero } from "@/features/landing/components/hero"
import { HowItWorks } from "@/features/landing/components/how-it-works"
import { Services } from "@/features/landing/components/services"
import { Team } from "@/features/landing/components/team"
import { ToolsTeaser } from "@/features/landing/components/tools-teaser"
import { WhoItsFor } from "@/features/landing/components/who-its-for"
import { getCurrentUser, isClient } from "@/server/auth"

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} | Powerlifting coaching with Tyler Montano` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
}

/** Coaching clients have a home of their own; the pitch is for everyone else. */
async function isSignedInClient() {
  try {
    return isClient(await getCurrentUser())
  } catch (error) {
    unstable_rethrow(error)
    console.error("[home] Could not load the current user:", error)
    return false
  }
}

export default async function HomePage() {
  if (await isSignedInClient()) redirect("/dashboard")

  const coach = await getCoachProfile()

  return (
    <>
      <Hero coach={coach} />
      <HowItWorks />
      <AboutCoach coach={coach} />
      <WhoItsFor />
      <Services />
      <Team coach={coach} />
      <ToolsTeaser />
      <FinalCta coachName={coach.name} />
    </>
  )
}
