import { ArrowRightIcon, MapPinIcon } from "lucide-react"
import Link from "next/link"

import { TMark } from "@/components/brand/t-mark"
import { Button } from "@/components/ui/button"
import { coachReachSentence, coachRecords, type CoachProfileData } from "@/config/coaching"
import { siteConfig } from "@/config/site"
import { getCoachProfile } from "@/features/coach/queries"

/** Invitation to apply for coaching, with the head coach's live records. */
export async function CoachingCta() {
  return <CoachingCtaView profile={await getCoachProfile()} />
}

export function CoachingCtaView({ profile }: { profile: CoachProfileData }) {
  return (
    <section
      aria-labelledby="coaching-heading"
      className="relative isolate overflow-hidden rounded-2xl bg-card ring-1 ring-primary/30"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-32 -z-10 size-112 rounded-full bg-primary/20 blur-3xl"
      />
      <TMark className="pointer-events-none absolute -right-12 -bottom-20 -z-10 w-80 text-foreground/4 sm:w-104" />

      <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
        <div className="flex flex-col gap-5">
          <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            Coaching
          </p>
          <h2
            id="coaching-heading"
            className="font-heading text-3xl leading-[1.05] font-bold text-balance uppercase sm:text-4xl"
          >
            Turn your numbers into a plan
          </h2>
          <p className="text-base text-pretty text-foreground/85">
            Your numbers are the starting point. Work one-on-one with {profile.title} {profile.name}{" "}
            to build your training and nutrition around your goals.
          </p>
          <p className="text-sm text-pretty text-muted-foreground">
            {profile.credentials} · {profile.yearsExperience}+ years of coaching and competition
            experience.
          </p>
          <div className="pt-1">
            <Button
              asChild
              size="lg"
              className="h-12 w-full px-6 font-heading text-base font-semibold tracking-wider uppercase sm:w-auto"
            >
              <Link href={siteConfig.cta.href}>
                Apply for coaching
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            An elite powerlifting team
          </p>
          <dl className="grid grid-cols-3 gap-2 sm:gap-3">
            {coachRecords(profile).map((record) => (
              <div
                key={record.label}
                className="flex flex-col items-center gap-1.5 rounded-xl bg-background/60 px-2 py-4 text-center ring-1 ring-foreground/10"
              >
                {/* Number shows first; the label follows and may wrap without shifting it. */}
                <dt className="order-last text-xs leading-snug text-muted-foreground">
                  {record.label}
                </dt>
                <dd className="order-first font-heading text-4xl leading-none font-bold sm:text-5xl">
                  {record.value}
                </dd>
              </div>
            ))}
          </dl>
          <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
            <MapPinIcon className="mt-px size-3.5 shrink-0 text-highlight" aria-hidden="true" />
            <span>{coachReachSentence(profile)}</span>
          </p>
        </div>
      </div>
    </section>
  )
}
