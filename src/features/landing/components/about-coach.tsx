import { ArrowRightIcon, AwardIcon, MapPinIcon, TimerIcon } from "lucide-react"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { SiteImage } from "@/components/site-image"
import { Button } from "@/components/ui/button"
import { type CoachProfileData } from "@/config/coaching"
import { siteImages } from "@/config/images"
import { siteConfig } from "@/config/site"

import { SectionHeading } from "./section-heading"

export function AboutCoach({ coach }: { coach: CoachProfileData }) {
  const credentials = coach.credentials
    .split("·")
    .map((item) => item.trim())
    .filter(Boolean)
  const firstName = coach.name.split(" ")[0] ?? coach.name

  return (
    <section id="about" aria-labelledby="about-heading" className="scroll-mt-20">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
        <Reveal className="order-last lg:order-first">
          <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/10">
            <SiteImage
              image={siteImages.coachPlatform}
              sizes="(min-width: 1024px) 560px, 100vw"
              className="h-auto w-full"
            />
          </div>
        </Reveal>

        <Reveal delay={0.05} className="flex flex-col gap-6">
          <SectionHeading id="about-heading" eyebrow="Meet your coach" title={coach.name} />
          <p className="text-lg leading-relaxed text-pretty text-foreground/85">{coach.bio}</p>
          <ul className="flex flex-wrap gap-2" aria-label="Credentials">
            {credentials.map((credential) => (
              <li
                key={credential}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium ring-1 ring-foreground/10"
              >
                <AwardIcon className="size-3.5 text-highlight" aria-hidden="true" />
                {credential}
              </li>
            ))}
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium ring-1 ring-foreground/10">
              <TimerIcon className="size-3.5 text-highlight" aria-hidden="true" />
              {coach.yearsExperience}+ years coaching &amp; competing
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium ring-1 ring-foreground/10">
              <MapPinIcon className="size-3.5 text-highlight" aria-hidden="true" />
              {coach.homeBase}
            </li>
          </ul>
          <div>
            <Button asChild size="lg" variant="outline" className="h-11 font-semibold">
              <Link href={siteConfig.cta.href}>
                Apply to work with {firstName}
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
