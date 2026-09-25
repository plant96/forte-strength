"use client"

import { cn } from "cn"
import { m } from "motion/react"

import { AnimatedNumber } from "@/components/motion/animated-number"
import { formatWeight } from "@/features/pr-tracker/lib/weight"
import type { WeightUnit } from "@/lib/units"

import type { DotsRanking } from "../lib/rankings"
import { InitialsTile } from "./initials-tile"
import { RankBadge, type MedalTone } from "./rank-badge"
import { list, podiumTile } from "./variants"
import { YouBadge } from "./you-badge"

interface Place {
  tone: MedalTone
  /** Visual order on wide screens: silver, gold, bronze, with gold standing tallest. */
  order: string
  ring: string
  band: string
}

const PLACES: Record<1 | 2 | 3, Place> = {
  1: { tone: "gold", order: "sm:order-2", ring: "ring-gold/40", band: "from-gold/15" },
  2: { tone: "silver", order: "sm:order-1", ring: "ring-silver/30", band: "from-silver/10" },
  3: { tone: "bronze", order: "sm:order-3", ring: "ring-bronze/40", band: "from-bronze/12" },
}

interface PodiumProps {
  /** Ranks 1–3, in rank order. Fewer is fine. */
  entries: DotsRanking[]
  unit: WeightUnit
  viewerId: string | null
}

/** The top three: gold in the middle and tallest, DOM order still 1, 2, 3 for screen readers. */
export function Podium({ entries, unit, viewerId }: PodiumProps) {
  return (
    <m.ol
      variants={list(0.12, 0.15)}
      aria-label="Podium"
      className="grid gap-3 sm:grid-cols-3 sm:items-end"
    >
      {entries.map((entry) => (
        <PodiumTile
          key={entry.athlete.id}
          entry={entry}
          unit={unit}
          isYou={entry.athlete.id === viewerId}
          alone={entries.length === 1}
        />
      ))}
    </m.ol>
  )
}

interface PodiumTileProps {
  entry: DotsRanking
  unit: WeightUnit
  isYou: boolean
  alone: boolean
}

function PodiumTile({ entry, unit, isYou, alone }: PodiumTileProps) {
  const place = PLACES[Math.min(entry.rank, 3) as 1 | 2 | 3]
  const first = entry.rank === 1

  return (
    <m.li
      variants={podiumTile}
      className={cn(
        "relative overflow-hidden rounded-2xl bg-background/40 ring-1",
        place.order,
        alone && "sm:col-start-2",
        isYou ? "ring-primary/50" : place.ring,
        first ? "p-6 sm:py-8" : "p-5",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-28 bg-linear-to-b to-transparent",
          place.band,
        )}
      />
      {first && (
        // A slow glow that settles behind the winning score; opacity only, so it's harmless
        // under reduced motion.
        <m.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-6 top-16 h-28 rounded-full bg-gold/15 blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.9, 0.5] }}
          transition={{ duration: 1.6, delay: 0.8, ease: "easeOut" }}
        />
      )}

      <div className="relative flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <RankBadge rank={entry.rank} size="lg" />
          {isYou && <YouBadge />}
        </div>
        <InitialsTile initials={entry.athlete.initials} tone={place.tone} size="lg" />
        <p className="font-heading text-xl leading-tight font-bold uppercase">
          {entry.athlete.name}
        </p>
        <div className="flex flex-col items-center">
          <p
            className={cn(
              "font-heading leading-none font-bold",
              first ? "text-5xl sm:text-6xl" : "text-4xl",
            )}
          >
            <AnimatedNumber value={entry.dots} decimals={2} from={0} />
          </p>
          <p className="mt-1 text-[0.65rem] font-semibold tracking-[0.3em] text-muted-foreground uppercase">
            DOTS
          </p>
        </div>
        <p className="text-sm text-muted-foreground tabular-nums">
          {formatWeight(entry.totalKg, unit)} total
        </p>
      </div>
    </m.li>
  )
}
