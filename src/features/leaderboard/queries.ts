import "server-only"

import { db } from "@/server/db"

import { buildAthletes, type LeaderboardAthlete } from "./lib/athletes"

export interface LeaderboardSnapshot {
  athletes: LeaderboardAthlete[]
  /** True when the database couldn't be read, so the boards say so rather than "nobody qualifies". */
  unavailable: boolean
}

/**
 * Every coaching client with a profile, with their best 1RM per series. One query; the
 * ranking and filtering happen in the browser over this small roster.
 */
export async function getLeaderboard(today: Date = new Date()): Promise<LeaderboardSnapshot> {
  try {
    const rows = await db.user.findMany({
      where: { clientSince: { not: null }, profile: { isNot: null } },
      orderBy: { clientSince: "asc" },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profile: { select: { birthDate: true, sex: true, weight: true, weightUnit: true } },
        prSeries: {
          where: { kind: "ONE_REP_MAX" },
          select: {
            exercise: { select: { name: true } },
            entries: {
              orderBy: { weightKg: "desc" },
              take: 1,
              select: { weightKg: true, achievedOn: true },
            },
          },
        },
      },
    })
    return { athletes: buildAthletes(rows, today), unavailable: false }
  } catch (error) {
    console.error("[leaderboard] Could not load the leaderboard:", error)
    return { athletes: [], unavailable: true }
  }
}
