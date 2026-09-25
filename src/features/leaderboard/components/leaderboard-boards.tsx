"use client"

import { useState } from "react"

import type { WeightUnit } from "@/lib/units"

import type { LeaderboardAthlete } from "../lib/athletes"
import type { LiftFilters } from "../lib/groups"
import { rankByDots, viewerDotsPosition } from "../lib/rankings"
import { DotsLeaderboard } from "./dots-leaderboard"
import { LiftLeaderboard } from "./lift-leaderboard"

interface LeaderboardBoardsProps {
  athletes: readonly LeaderboardAthlete[]
  unavailable: boolean
  viewerId: string | null
  viewerIsClient: boolean
  /** The viewer's gym-weight unit; lb for visitors. */
  defaultUnit: WeightUnit
  initialFilters: LiftFilters
}

/** Both boards, sharing one lb/kg choice. */
export function LeaderboardBoards({
  athletes,
  unavailable,
  viewerId,
  viewerIsClient,
  defaultUnit,
  initialFilters,
}: LeaderboardBoardsProps) {
  const [unit, setUnit] = useState<WeightUnit>(defaultUnit)
  const rankings = rankByDots(athletes)
  const qualifiedCount = rankByDots(athletes, Infinity).length
  const you = viewerDotsPosition(athletes, viewerId)

  return (
    <div className="mt-10 flex flex-col gap-10 sm:mt-12 sm:gap-14">
      <DotsLeaderboard
        rankings={rankings}
        you={you}
        qualifiedCount={qualifiedCount}
        viewerId={viewerId}
        viewerIsClient={viewerIsClient}
        unavailable={unavailable}
        unit={unit}
        onUnitChange={setUnit}
      />
      <LiftLeaderboard
        athletes={athletes}
        viewerId={viewerId}
        unavailable={unavailable}
        unit={unit}
        onUnitChange={setUnit}
        initialFilters={initialFilters}
      />
    </div>
  )
}
