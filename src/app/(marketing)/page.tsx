import type { Metadata } from "next"

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

export const metadata: Metadata = {
  title: { absolute: `${siteConfig.name} | Powerlifting coaching with Tyler Montano` },
  description: siteConfig.description,
  alternates: { canonical: "/" },
}

export default async function HomePage() {
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
