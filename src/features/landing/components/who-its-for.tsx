import { DumbbellIcon, FlameIcon, MedalIcon, type LucideIcon } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"

import { SectionHeading } from "./section-heading"

// Matches the "primary need" options on the application.
const AUDIENCES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: MedalIcon,
    title: "Competitive powerlifters",
    body: "Peak for your next meet with a plan that respects the calendar, from locals to Nationals and Worlds.",
  },
  {
    icon: DumbbellIcon,
    title: "Recreational lifters",
    body: "Get stronger on squat, bench and deadlift without the guesswork.",
  },
  {
    icon: FlameIcon,
    title: "Weight loss & recomp",
    body: "Lose fat and change your body composition while keeping, and building, your strength.",
  },
]

export function WhoItsFor() {
  return (
    <section aria-labelledby="audience-heading" className="border-y border-border/60 bg-card/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <SectionHeading
            id="audience-heading"
            eyebrow="Who it's for"
            title="Built for lifters with a goal"
            align="center"
          />
        </Reveal>
        <ul className="grid gap-4 md:grid-cols-3">
          {AUDIENCES.map((audience, index) => (
            <Reveal key={audience.title} as="li" delay={index * 0.06}>
              <div className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl bg-background/60 p-7 ring-1 ring-foreground/10">
                <audience.icon
                  className="absolute -top-3 -right-3 size-24 text-primary/10"
                  aria-hidden="true"
                />
                <audience.icon className="size-7 text-highlight" aria-hidden="true" />
                <h3 className="font-heading text-xl font-bold uppercase">{audience.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{audience.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
