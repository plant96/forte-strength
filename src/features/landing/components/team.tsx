import { MapPinIcon } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { SiteImage } from "@/components/site-image"
import { coachReachSentence, type CoachProfileData } from "@/config/coaching"
import { siteImages } from "@/config/images"

import { SectionHeading } from "./section-heading"

export function Team({ coach }: { coach: CoachProfileData }) {
  return (
    <section aria-labelledby="team-heading">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-16 sm:px-6 sm:py-24">
        <Reveal className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeading
            id="team-heading"
            eyebrow="The team"
            title="A team that competes"
            description={coachReachSentence(coach)}
          />
          <ul
            className="flex flex-wrap gap-2 lg:max-w-sm lg:justify-end"
            aria-label="Where our lifters are"
          >
            {[coach.homeBase, ...coach.reach].map((place) => (
              <li
                key={place}
                className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium ring-1 ring-foreground/10"
              >
                <MapPinIcon className="size-3.5 text-highlight" aria-hidden="true" />
                {place}
              </li>
            ))}
          </ul>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3 md:grid-rows-2">
          <Reveal className="overflow-hidden rounded-3xl ring-1 ring-foreground/10 md:col-span-2 md:row-span-2">
            <SiteImage
              image={siteImages.teamMeetDay}
              sizes="(min-width: 768px) 66vw, 100vw"
              className="h-full w-full object-cover"
            />
          </Reveal>
          <Reveal delay={0.06} className="overflow-hidden rounded-3xl ring-1 ring-foreground/10">
            <SiteImage
              image={siteImages.teamTraining}
              sizes="(min-width: 768px) 33vw, 100vw"
              className="h-full w-full object-cover"
            />
          </Reveal>
          <Reveal delay={0.12} className="overflow-hidden rounded-3xl ring-1 ring-foreground/10">
            <SiteImage
              image={siteImages.athleteLift}
              sizes="(min-width: 768px) 33vw, 100vw"
              className="h-full w-full object-cover"
            />
          </Reveal>
        </div>
      </div>
    </section>
  )
}
