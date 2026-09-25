"use client"

import { cn } from "cn"
import { PlusIcon, TrophyIcon } from "lucide-react"
import { m } from "motion/react"
import Link from "next/link"

import { AnimatedNumber } from "@/components/motion/animated-number"
import { LightSweep } from "@/components/motion/light-sweep"
import { Button } from "@/components/ui/button"
import { formatWeight } from "@/features/pr-tracker/lib/weight"
import { formatNumber } from "@/lib/breakdown/format"
import type { WeightUnit } from "@/lib/units"

import type { DotsRanking } from "../lib/rankings"
import { BoardEmptyState } from "./board-empty-state"
import { InitialsTile } from "./initials-tile"
import { Podium } from "./podium"
import { RankBadge } from "./rank-badge"
import { UnitToggle } from "./unit-toggle"
import { enter, list, row } from "./variants"
import { YouBadge } from "./you-badge"

const ADD_HREF = "/tools/pr-tracker?panel=add"

interface DotsLeaderboardProps {
  /** The top ten (or fewer). */
  rankings: DotsRanking[]
  /** The viewer's own place in the full order, when they qualify. */
  you: DotsRanking | null
  /** How many athletes qualify in total, for "#12 of 14". */
  qualifiedCount: number
  viewerId: string | null
  viewerIsClient: boolean
  unavailable: boolean
  unit: WeightUnit
  onUnitChange: (unit: WeightUnit) => void
}

/** The team's best DOTS: a podium for the top three and a list for the rest of the ten. */
export function DotsLeaderboard({
  rankings,
  you,
  qualifiedCount,
  viewerId,
  viewerIsClient,
  unavailable,
  unit,
  onUnitChange,
}: DotsLeaderboardProps) {
  const rest = rankings.slice(3)
  const outsideTop = you !== null && you.rank > rankings.length

  return (
    <m.section
      variants={enter}
      initial="hidden"
      animate="show"
      aria-labelledby="dots-board-heading"
      className="relative min-w-0 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
    >
      <LightSweep delay={0.9} />

      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-1">
          <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            Top 10
          </p>
          <h2 id="dots-board-heading" className="font-heading text-2xl font-bold uppercase">
            Best DOTS on the team
          </h2>
        </div>
        <UnitToggle value={unit} onChange={onUnitChange} />
      </div>

      {rankings.length === 0 ? (
        <DotsEmpty unavailable={unavailable} viewerIsClient={viewerIsClient} />
      ) : (
        <div className="flex flex-col gap-5 p-4 sm:p-6">
          <Podium entries={rankings.slice(0, 3)} unit={unit} viewerId={viewerId} />

          {rest.length > 0 && (
            <m.ol
              variants={list(0.07, 0.45)}
              start={4}
              aria-label="Ranks 4 to 10"
              className="flex flex-col gap-2"
            >
              {rest.map((entry) => (
                <DotsRow
                  key={entry.athlete.id}
                  entry={entry}
                  unit={unit}
                  isYou={entry.athlete.id === viewerId}
                />
              ))}
            </m.ol>
          )}

          <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-4">
            <p>
              DOTS from each athlete&apos;s best squat, bench and deadlift 1RM and their current
              profile bodyweight. No age coefficient.
            </p>
            {outsideTop && (
              <p className="shrink-0 font-medium text-foreground/90 tabular-nums">
                You&apos;re #{you.rank} of {qualifiedCount} · {formatNumber(you.dots, 2)} DOTS
              </p>
            )}
          </div>
        </div>
      )}
    </m.section>
  )
}

function DotsRow({ entry, unit, isYou }: { entry: DotsRanking; unit: WeightUnit; isYou: boolean }) {
  return (
    <m.li
      variants={row}
      className={cn(
        "grid grid-cols-[2rem_2.5rem_minmax(0,1fr)_auto] items-center gap-3 rounded-xl px-3 py-2.5 ring-1",
        isYou ? "bg-primary/5 ring-primary/30" : "bg-background/40 ring-foreground/10",
      )}
    >
      <RankBadge rank={entry.rank} />
      <InitialsTile initials={entry.athlete.initials} />
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{entry.athlete.name}</span>
        {isYou && <YouBadge />}
      </div>
      <div className="flex flex-col items-end">
        <span className="font-heading text-2xl leading-none font-bold">
          <AnimatedNumber value={entry.dots} decimals={2} from={0} />
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          {formatWeight(entry.totalKg, unit)} total
        </span>
      </div>
    </m.li>
  )
}

function DotsEmpty({
  unavailable,
  viewerIsClient,
}: {
  unavailable: boolean
  viewerIsClient: boolean
}) {
  if (unavailable) {
    return (
      <BoardEmptyState icon={TrophyIcon} title="Leaderboard unavailable">
        Couldn&apos;t reach the PR tracker just now. Try again in a moment.
      </BoardEmptyState>
    )
  }

  if (viewerIsClient) {
    return (
      <BoardEmptyState
        icon={TrophyIcon}
        title="No DOTS scores yet"
        action={
          <Button asChild size="lg" className="h-11 font-heading tracking-wider uppercase">
            <Link href={ADD_HREF}>
              <PlusIcon />
              Log a PR
            </Link>
          </Button>
        }
      >
        Log a 1RM for squat, bench and deadlift in the PR tracker and you&apos;re on the board.
      </BoardEmptyState>
    )
  }

  return (
    <BoardEmptyState icon={TrophyIcon} title="The board is warming up">
      Scores appear as the team logs squat, bench and deadlift 1RMs in the PR tracker.
    </BoardEmptyState>
  )
}
