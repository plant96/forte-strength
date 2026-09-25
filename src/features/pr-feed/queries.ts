import "server-only"

import { classifyCompetitionLift, type CompetitionLift } from "@/features/pr-tracker/lib/lifts"
import { db } from "@/server/db"

import { buildFeed, PR_FEED_SIZE, type FeedPr } from "./lib/feed"

/**
 * The team feed on the dashboard: the latest squat, bench and deadlift PRs from everyone
 * who can use the PR tracker today — coaching clients and admins.
 *
 * Exercise names are free text, so which ones count is decided by
 * `classifyCompetitionLift`, not SQL. The team's movements are a short list, so they are
 * classified first and only then are entries read, already narrowed to the lifts that count.
 *
 * Null when the database couldn't be read, so the dashboard hides the feed rather than
 * claiming nobody has lifted.
 */
export async function getTeamPrFeed(viewerId: string): Promise<FeedPr[] | null> {
  try {
    const exercises = await db.exercise.findMany({
      where: { user: { OR: [{ clientSince: { not: null } }, { role: "ADMIN" }] } },
      select: { id: true, name: true },
    })

    const liftByExercise = new Map<string, CompetitionLift>()
    for (const exercise of exercises) {
      const lift = classifyCompetitionLift(exercise.name)
      if (lift) liftByExercise.set(exercise.id, lift)
    }
    if (liftByExercise.size === 0) return []

    const rows = await db.prEntry.findMany({
      where: { series: { exerciseId: { in: [...liftByExercise.keys()] } } },
      // Two records can share a day; the later-logged one is the newer PR.
      orderBy: [{ achievedOn: "desc" }, { createdAt: "desc" }],
      take: PR_FEED_SIZE,
      select: {
        id: true,
        userId: true,
        weightKg: true,
        achievedOn: true,
        user: { select: { firstName: true, lastName: true } },
        series: {
          select: {
            kind: true,
            sets: true,
            reps: true,
            exerciseId: true,
            // Every weight on the series, for the gain over the record before this one.
            entries: { select: { id: true, weightKg: true } },
          },
        },
      },
    })

    return buildFeed(rows, liftByExercise, viewerId)
  } catch (error) {
    console.error("[pr-feed] Could not load the team PR feed:", error)
    return null
  }
}
