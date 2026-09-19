import { ArrowRightIcon, CalculatorIcon } from "lucide-react"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { SiteImage } from "@/components/site-image"
import { Button } from "@/components/ui/button"
import { coachRecords, type CoachProfileData } from "@/config/coaching"
import { siteImages } from "@/config/images"
import { siteConfig } from "@/config/site"

export function Hero({ coach }: { coach: CoachProfileData }) {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-0 left-1/2 -z-10 h-160 w-240 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl"
      />
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 px-4 pt-12 pb-16 sm:px-6 sm:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:gap-16 lg:pt-20 lg:pb-24">
        <Reveal className="flex flex-col gap-7">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-heading text-xs font-semibold tracking-[0.25em] text-highlight uppercase ring-1 ring-primary/30">
            Powerlifting coaching
          </p>
          <h1
            id="hero-heading"
            className="font-heading text-5xl leading-[0.95] font-extrabold text-balance uppercase sm:text-6xl lg:text-7xl"
          >
            Get stronger with an <span className="text-primary">elite</span> powerlifting team
          </h1>
          <p className="max-w-xl text-lg text-pretty text-muted-foreground">
            Individualized coaching from {coach.title} {coach.name}. Whether you&apos;re chasing
            your first meet, a bigger total or a leaner physique, you get a plan built around you.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 px-6 font-heading text-base font-semibold tracking-wider uppercase"
            >
              <Link href={siteConfig.cta.href}>
                Apply for coaching
                <ArrowRightIcon />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-5 text-sm font-semibold">
              <Link href="/tdee-calculator">
                <CalculatorIcon className="text-highlight" />
                Try the free TDEE calculator
              </Link>
            </Button>
          </div>
          <dl className="grid max-w-lg grid-cols-3 gap-4 border-t border-border pt-6">
            {coachRecords(coach).map((record) => (
              <div key={record.label} className="flex flex-col gap-1">
                <dt className="order-last text-xs leading-snug text-muted-foreground">
                  {record.label}
                </dt>
                <dd className="order-first font-heading text-4xl leading-none font-bold">
                  {record.value}
                </dd>
              </div>
            ))}
          </dl>
        </Reveal>

        <Reveal delay={0.1} className="relative mx-auto w-full max-w-sm lg:max-w-none">
          <div
            aria-hidden="true"
            className="absolute -inset-4 -z-10 rounded-[2rem] bg-linear-to-br from-primary/30 via-primary/5 to-transparent blur-2xl"
          />
          <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/10">
            <SiteImage
              image={siteImages.coachPortrait}
              preload
              sizes="(min-width: 1024px) 420px, 90vw"
              className="h-auto w-full"
            />
          </div>
          <div className="absolute right-5 -bottom-5 left-5 flex items-center justify-between gap-3 rounded-2xl bg-card/90 px-4 py-3 ring-1 ring-foreground/10 backdrop-blur-md sm:left-auto sm:w-72">
            <div className="flex flex-col">
              <span className="font-heading text-lg leading-tight font-bold uppercase">
                {coach.name}
              </span>
              <span className="text-xs text-muted-foreground">{coach.title}</span>
            </div>
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[0.7rem] font-semibold text-highlight">
              {coach.yearsExperience}+ yrs
            </span>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
