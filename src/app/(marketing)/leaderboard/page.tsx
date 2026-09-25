import type { Metadata } from "next"

import { CoachingCta } from "@/components/marketing/coaching-cta"
import { LeaderboardBoards } from "@/features/leaderboard/components/leaderboard-boards"
import { LeaderboardHeader } from "@/features/leaderboard/components/leaderboard-header"
import { profileBody } from "@/features/leaderboard/lib/athletes"
import { defaultLiftFilters } from "@/features/leaderboard/lib/groups"
import { rankByDots } from "@/features/leaderboard/lib/rankings"
import { getLeaderboard } from "@/features/leaderboard/queries"
import { getViewer } from "@/features/profile/queries"

const description =
  "Where the Forte Strength team stands: the top DOTS scores across the roster, and the best squat, bench and deadlift in every age group and weight class, straight from the PR tracker."

export const metadata: Metadata = {
  title: "Leaderboard",
  description,
  alternates: { canonical: "/leaderboard" },
  openGraph: {
    title: "Leaderboard | Forte Strength Systems",
    description,
    url: "/leaderboard",
  },
}

/**
 * Public, but built only from coaching clients' PR trackers. The viewer lookup makes the
 * page render per request, so a PR logged a minute ago is already on the board.
 */
export default async function LeaderboardPage() {
  const today = new Date()
  const [viewer, snapshot] = await Promise.all([getViewer(), getLeaderboard(today)])
  const initialFilters = defaultLiftFilters(
    viewer.profile ? profileBody(viewer.profile, today) : null,
  )

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <LeaderboardHeader
        athleteCount={snapshot.athletes.length}
        qualifiedCount={rankByDots(snapshot.athletes, Infinity).length}
      />
      <LeaderboardBoards
        athletes={snapshot.athletes}
        unavailable={snapshot.unavailable}
        viewerId={viewer.id}
        viewerIsClient={viewer.client}
        defaultUnit={viewer.liftUnit}
        initialFilters={initialFilters}
      />
      {!viewer.client && (
        <div className="mt-16 sm:mt-20">
          <CoachingCta />
        </div>
      )}
    </div>
  )
}
