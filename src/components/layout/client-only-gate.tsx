import { ArrowRightIcon, CheckIcon, LockIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

/**
 * What a coaching client's area looks like to everyone else.
 *
 * Deliberately a page and not a redirect to sign-in. Someone who followed a link here is
 * curious, which is the best moment there is to ask them to apply — bouncing them to an
 * auth screen spends that moment on a form they have no reason to fill in. The real
 * content is never fetched or rendered behind this; the gate replaces it server-side.
 */

const FEATURES = {
  "pr-tracker": {
    title: "PR Tracker",
    blurb:
      "Every personal record you set, plotted and kept. Watch the line climb session after session.",
    bullets: [
      "One graph per lift, per rep scheme — bench singles and 3×5 squats tracked separately",
      "Every record dated, so you can see exactly how fast you are moving",
      "Your coach sees the same graphs you do, and can log the maxes you hit together",
    ],
  },
  "mobility-vault": {
    title: "Mobility Vault",
    blurb:
      "The mobility, flexibility and warm-up work that keeps squat, bench and deadlift moving well.",
    bullets: [
      "Drills organised by lift, with the positions each one is meant to fix",
      "Warm-up sequences you can run before a session without thinking",
      "Built from what actually works on Tyler's roster, not a generic list",
    ],
  },
} as const

export type ClientOnlyFeature = keyof typeof FEATURES

export function ClientOnlyGate({
  feature,
  signedIn,
}: {
  feature: ClientOnlyFeature
  signedIn: boolean
}) {
  const { title, blurb, bullets } = FEATURES[feature]

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="flex flex-col items-center gap-6 rounded-2xl bg-card p-6 text-center ring-1 ring-primary/25 sm:p-10">
        <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-highlight">
          <LockIcon className="size-5" />
        </span>

        <div className="flex flex-col gap-2">
          <p className="font-heading text-xs font-semibold tracking-[0.2em] text-highlight uppercase">
            Coaching clients only
          </p>
          <h1 className="font-heading text-3xl font-bold tracking-tight uppercase sm:text-4xl">
            {title}
          </h1>
          <p className="text-base text-balance text-muted-foreground">{blurb}</p>
        </div>

        <ul className="flex w-full flex-col gap-2.5 text-left">
          {bullets.map((bullet) => (
            <li key={bullet} className="flex gap-2.5 text-sm text-muted-foreground">
              <CheckIcon className="mt-0.5 size-4 shrink-0 text-highlight" />
              <span>{bullet}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col items-center gap-3 pt-2">
          <Button asChild className="h-11 px-6 font-heading tracking-wider uppercase">
            <Link href={siteConfig.cta.href}>
              Apply for coaching
              <ArrowRightIcon />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            {signedIn ? (
              <>Already coaching with Tyler? He&apos;ll unlock this the moment your plan starts.</>
            ) : (
              <>
                Already a client?{" "}
                <Link href="/sign-in" className="text-highlight underline-offset-4 hover:underline">
                  Sign in
                </Link>{" "}
                to open it.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
