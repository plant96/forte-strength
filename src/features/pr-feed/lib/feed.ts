import { leaderboardName } from "@/features/leaderboard/lib/name"
import { COMPETITION_LIFT_LABELS, type CompetitionLift } from "@/features/pr-tracker/lib/lifts"
import type { SeriesShape } from "@/features/pr-tracker/lib/series"
import { formatWeight } from "@/features/pr-tracker/lib/weight"
import { PR_KIND_FROM_DB } from "@/features/pr-tracker/mappers"
import { daysBetween, toDay, type Day } from "@/lib/day"
import type { WeightUnit } from "@/lib/units"

/**
 * The dashboard's team feed: the most recent squat, bench and deadlift PRs from everyone
 * on the team, whatever the PR type.
 *
 * Every entry on a series is a PR — the line may only climb (see `pr-tracker/lib/records`)
 * — so "recent PRs" is simply "recent entries" on a competition-lift series.
 */

export const PR_FEED_SIZE = 20

/** One slide. Plain strings and numbers only, so it crosses to the client unchanged. */
export interface FeedPr {
  id: string
  /** "Tyler M." — first name and last initial, as on the leaderboard. */
  name: string
  /** The viewer's own PR, which reads "You just hit…". */
  mine: boolean
  lift: CompetitionLift
  shape: SeriesShape
  weightKg: number
  /** Over the record before it on the same series; null for a series' first entry. */
  gainKg: number | null
  achievedOn: Day
}

/** One entry as the feed query selects it. */
export interface FeedRow {
  id: string
  userId: string
  weightKg: number
  achievedOn: Date
  user: { firstName: string | null; lastName: string | null }
  series: {
    kind: keyof typeof PR_KIND_FROM_DB
    sets: number
    reps: number
    exerciseId: string
    entries: { id: string; weightKg: number }[]
  }
}

/** A gram, the same tolerance the record check uses for kg-converted floats. */
const EPSILON = 1e-6

/**
 * The gain over the previous record. On a line that only climbs, that record is the
 * heaviest other entry lighter than this one — whenever either was logged.
 */
function gainOver(row: FeedRow) {
  let previous: number | null = null
  for (const entry of row.series.entries) {
    if (entry.id === row.id || row.weightKg - entry.weightKg <= EPSILON) continue
    if (previous === null || entry.weightKg > previous) previous = entry.weightKg
  }
  return previous === null ? null : row.weightKg - previous
}

/** Query rows to slides, in the order they came (newest first). */
export function buildFeed(
  rows: readonly FeedRow[],
  liftByExercise: ReadonlyMap<string, CompetitionLift>,
  viewerId: string,
): FeedPr[] {
  const feed: FeedPr[] = []
  for (const row of rows) {
    const lift = liftByExercise.get(row.series.exerciseId)
    if (!lift) continue
    feed.push({
      id: row.id,
      name: leaderboardName(row.user.firstName, row.user.lastName),
      mine: row.userId === viewerId,
      lift,
      shape: {
        kind: PR_KIND_FROM_DB[row.series.kind],
        sets: row.series.sets,
        reps: row.series.reps,
      },
      weightKg: row.weightKg,
      gainKg: gainOver(row),
      achievedOn: toDay(row.achievedOn),
    })
  }
  return feed
}

export type SentenceTone = "subject" | "weight" | "lift" | "plain"

export interface SentenceSegment {
  text: string
  tone: SentenceTone
}

/**
 * "Jim R. just hit 240 lb on bench for 4 reps", in styled pieces.
 *
 * "just" only for a PR from today or yesterday, by the viewer's own day; without one
 * (`now` null), it is left out.
 */
export function prSentence(pr: FeedPr, unit: WeightUnit, now: Day | null): SentenceSegment[] {
  const fresh = now !== null && daysBetween(pr.achievedOn, now) <= 1
  const { kind, sets, reps } = pr.shape
  const tail =
    kind === "one-rep-max"
      ? "for a new max"
      : kind === "rep"
        ? `for ${reps} reps`
        : `for ${sets}×${reps}`

  return [
    { text: pr.mine ? "You" : pr.name, tone: "subject" },
    { text: fresh ? "just hit" : "hit", tone: "plain" },
    { text: formatWeight(pr.weightKg, unit), tone: "weight" },
    { text: "on", tone: "plain" },
    { text: COMPETITION_LIFT_LABELS[pr.lift].toLowerCase(), tone: "lift" },
    { text: tail, tone: "plain" },
  ]
}

export function sentenceText(segments: readonly SentenceSegment[]) {
  return segments.map((segment) => segment.text).join(" ")
}

/**
 * The headline's unbreakable pieces, in order. A name ("Korbyn B.") and a weight
 * ("580 lb") never split across lines, and the sentence's last two words stay together,
 * so no line is ever left holding a lone "max" or "reps".
 */
export function headlineWords(segments: readonly SentenceSegment[]): SentenceSegment[] {
  return segments.flatMap((segment, index) => {
    if (segment.tone !== "plain") return [segment]
    const words = segment.text.split(" ")
    const last = index === segments.length - 1
    const cut = last && words.length > 1 ? words.length - 2 : words.length
    return [
      ...words.slice(0, cut),
      ...(cut < words.length ? [words.slice(cut).join(" ")] : []),
    ].map((text) => ({ text, tone: segment.tone }))
  })
}
