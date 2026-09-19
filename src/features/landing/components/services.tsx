import {
  ClipboardListIcon,
  MessagesSquareIcon,
  SaladIcon,
  TrophyIcon,
  UsersRoundIcon,
  VideoIcon,
  type LucideIcon,
} from "lucide-react"

import { Reveal } from "@/components/motion/reveal"

import { SectionHeading } from "./section-heading"

// Placeholder copy: confirm the services Coach Tyler actually offers.
const SERVICES: { icon: LucideIcon; title: string; body: string }[] = [
  {
    icon: ClipboardListIcon,
    title: "Individualized programming",
    body: "Training built for your lifts, weak points, schedule and recovery.",
  },
  {
    icon: TrophyIcon,
    title: "Meet prep & attempts",
    body: "Peaking, attempt selection and a game plan for meet day.",
  },
  {
    icon: VideoIcon,
    title: "Technique feedback",
    body: "Video review so every rep moves you closer to your best lift.",
  },
  {
    icon: SaladIcon,
    title: "Nutrition guidance",
    body: "Calorie and macro targets that support your training and your goals.",
  },
  {
    icon: MessagesSquareIcon,
    title: "Check-ins & adjustments",
    body: "Regular check-ins so your plan adapts as you progress.",
  },
  {
    icon: UsersRoundIcon,
    title: "A team behind you",
    body: "Train alongside driven lifters chasing the same standard.",
  },
]

export function Services() {
  return (
    <section aria-labelledby="services-heading">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <SectionHeading
            id="services-heading"
            eyebrow="What you get"
            title="Everything you need to get strong"
            description="Coaching covers the whole picture, from your program to your plate."
          />
        </Reveal>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((service, index) => (
            <Reveal key={service.title} as="li" delay={index * 0.04}>
              <div className="group flex h-full flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-highlight ring-1 ring-primary/25">
                  <service.icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="font-heading text-lg font-bold uppercase">{service.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{service.body}</p>
              </div>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  )
}
