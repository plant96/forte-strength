"use client"

import { UsersIcon } from "lucide-react"
import { m, type Variants } from "motion/react"

import { AnimatedNumber } from "@/components/motion/animated-number"

import { enter, stagger } from "./variants"

const TITLE = "Leaderboard"

const letter: Variants = {
  hidden: { y: "115%", opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 220, damping: 26 } },
}

interface LeaderboardHeaderProps {
  athleteCount: number
  qualifiedCount: number
}

/** Eyebrow, a title that rises letter by letter, the blurb, and a live count. */
export function LeaderboardHeader({ athleteCount, qualifiedCount }: LeaderboardHeaderProps) {
  return (
    <m.header
      variants={stagger(0.09)}
      initial="hidden"
      animate="show"
      className="relative flex flex-col gap-4"
    >
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-24 -z-10 h-72 w-[28rem] rounded-full bg-primary/10 blur-3xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-16 right-0 -z-10 h-56 w-80 rounded-full bg-gold/8 blur-3xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.6, delay: 0.2, ease: "easeOut" }}
      />

      <m.p
        variants={enter}
        className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase"
      >
        Team
      </m.p>
      <m.h1
        variants={stagger(0.035)}
        aria-label={TITLE}
        className="font-heading text-4xl leading-[1.02] font-extrabold text-balance uppercase sm:text-6xl"
      >
        {[...TITLE].map((character, index) => (
          <span
            key={index}
            aria-hidden="true"
            className="inline-block overflow-hidden pb-[0.06em] align-bottom"
          >
            <m.span variants={letter} className="inline-block">
              {character}
            </m.span>
          </span>
        ))}
      </m.h1>
      <m.p
        variants={enter}
        className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg"
      >
        Where the Forte Strength team stands: the top DOTS scores on the roster, and the best squat,
        bench and deadlift in every age group and weight class, straight from the PR tracker.
      </m.p>
      <m.p
        variants={enter}
        className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground tabular-nums"
      >
        <UsersIcon className="size-3.5 text-highlight" aria-hidden="true" />
        <span>
          <AnimatedNumber value={athleteCount} from={0} /> athletes
        </span>
        <span aria-hidden="true">·</span>
        <span>
          <AnimatedNumber value={qualifiedCount} from={0} /> on the DOTS board
        </span>
        <span aria-hidden="true">·</span>
        <span>Live from the PR tracker</span>
      </m.p>
    </m.header>
  )
}
