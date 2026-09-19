import { LockIcon } from "lucide-react"
import type { Metadata } from "next"

import { SiteImage } from "@/components/site-image"
import { siteImages } from "@/config/images"
import { ApplicationForm } from "@/features/applications/components/application-form"
import { getCoachProfile } from "@/features/coach/queries"

export const metadata: Metadata = {
  title: "Apply for coaching",
  description:
    "Apply to join Team Forte Strength. Tell Coach Tyler Montano about your lifting, your goals and your challenges.",
  alternates: { canonical: "/application" },
}

export default async function ApplicationPage() {
  const coach = await getCoachProfile()
  const firstName = coach.name.split(" ")[0] ?? coach.name

  const nextSteps = [
    `${firstName} reads your application personally.`,
    "If it's a fit, he reaches out to talk through your goals.",
    "You get a program built around you, and the work begins.",
  ]

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 flex max-w-3xl flex-col gap-4">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
          Coaching application
        </p>
        <h1 className="font-heading text-4xl leading-[1.02] font-extrabold text-balance uppercase sm:text-5xl">
          Apply to Team Forte Strength
        </h1>
        <p className="text-base text-pretty text-muted-foreground sm:text-lg">
          Tell {firstName} about you, your lifting and your goals. The more detail you give, the
          better he can understand where you are and how to get you where you want to go.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-10">
        <ApplicationForm />

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="hidden overflow-hidden rounded-2xl ring-1 ring-foreground/10 lg:block">
            <SiteImage image={siteImages.applicationSide} sizes="300px" className="h-auto w-full" />
          </div>
          <div className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <h2 className="font-heading text-sm font-semibold tracking-[0.2em] uppercase">
              What happens next
            </h2>
            <ol className="mt-4 flex flex-col gap-3">
              {nextSteps.map((text, index) => (
                <li key={text} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/15 font-heading text-xs font-bold text-highlight">
                    {index + 1}
                  </span>
                  {text}
                </li>
              ))}
            </ol>
          </div>
          <p className="flex items-start gap-2 px-1 text-xs text-muted-foreground">
            <LockIcon className="mt-px size-3.5 shrink-0 text-highlight" aria-hidden="true" />
            Your answers are only visible to {coach.name} and are used to review your application.
          </p>
        </aside>
      </div>
    </div>
  )
}
