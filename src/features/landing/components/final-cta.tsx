import { ArrowRightIcon } from "lucide-react"
import Link from "next/link"

import { Reveal } from "@/components/motion/reveal"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"

export function FinalCta({ coachName }: { coachName: string }) {
  const firstName = coachName.split(" ")[0] ?? coachName

  return (
    <section aria-labelledby="final-cta-heading" className="px-4 py-16 sm:px-6 sm:py-24">
      <Reveal className="relative isolate mx-auto flex w-full max-w-4xl flex-col items-center gap-6 overflow-hidden rounded-3xl bg-card px-6 py-14 text-center ring-1 ring-primary/30 sm:px-12">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 -top-32 -z-10 mx-auto h-64 w-3/4 rounded-full bg-primary/25 blur-3xl"
        />
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
          Ready when you are
        </p>
        <h2
          id="final-cta-heading"
          className="font-heading text-4xl leading-[1.02] font-extrabold text-balance uppercase sm:text-5xl"
        >
          Your next PR starts with an application
        </h2>
        <p className="max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          Tell {firstName} where you are and where you want to go. Every application is read
          personally.
        </p>
        <Button
          asChild
          size="lg"
          className="h-12 px-8 font-heading text-base font-semibold tracking-wider uppercase"
        >
          <Link href={siteConfig.cta.href}>
            Apply for coaching
            <ArrowRightIcon />
          </Link>
        </Button>
      </Reveal>
    </section>
  )
}
