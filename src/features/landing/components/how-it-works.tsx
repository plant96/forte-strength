import { Reveal } from "@/components/motion/reveal"

import { SectionHeading } from "./section-heading"

// Placeholder copy: confirm these steps match how Coach Tyler onboards athletes.
const STEPS = [
  {
    title: "Apply",
    body: "Tell Coach Tyler your story, your goals and what's been holding you back in a short application.",
  },
  {
    title: "Review & consultation",
    body: "Every application is reviewed personally. If it's a fit, Tyler reaches out to talk through your goals.",
  },
  {
    title: "Your custom program",
    body: "Get programming built around your schedule, recovery and goals, not a copy-and-paste template.",
  },
  {
    title: "Train, check in, compete",
    body: "Regular check-ins and feedback keep you progressing, all the way to the platform.",
  },
]

export function HowItWorks() {
  return (
    <section aria-labelledby="how-heading" className="border-y border-border/60 bg-card/40">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <SectionHeading
            id="how-heading"
            eyebrow="How it works"
            title="From application to the platform"
            align="center"
          />
        </Reveal>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, index) => (
            <Reveal key={step.title} as="li" delay={index * 0.06} className="relative flex">
              <div className="flex w-full flex-col gap-3 rounded-2xl bg-background/60 p-6 ring-1 ring-foreground/10">
                <span className="font-heading text-5xl leading-none font-extrabold text-primary/80">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="font-heading text-xl font-bold uppercase">{step.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{step.body}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  )
}
