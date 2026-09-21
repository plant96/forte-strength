import "server-only"

import { unstable_rethrow } from "next/navigation"

import { WEIGHT_UNIT_FROM_DB } from "@/features/profile/mappers"
import type { Prisma } from "@/generated/prisma/client"
import { db } from "@/server/db"
import type { WeightUnit } from "@/lib/units"

import { toDay, type Day } from "@/lib/day"
import { currentRecord } from "./lib/records"
import { seriesKey, type PrKind, type SeriesShape } from "./lib/series"
import { PR_KIND_FROM_DB, PR_KIND_TO_DB } from "./mappers"

/**
 * Reads for the PR tracker.
 *
 * Every function takes the athlete's `userId` explicitly rather than reaching for the
 * session, which is what lets the admin render a client's page with the very same
 * components. Callers are responsible for the access check — see `getClientAreaUser` and
 * `requireAdmin` in `server/auth.ts`.
 *
 * Dates come back as "YYYY-MM-DD" strings (see `lib/day.ts`): `achievedOn` is a calendar
 * day, and rendering a UTC-midnight `Date` in a local timezone shows the day before.
 */

export interface EntryView {
  id: string
  weightKg: number
  achievedOn: Day
  /** Logged by the coach rather than the athlete. */
  byCoach: boolean
}

export interface SeriesView extends SeriesShape {
  id: string
  /** The URL segment for this series: `1rm`, `2rep`, `3x5`. */
  key: string
  /** Ascending by date — which, on a line that only climbs, is also ascending by weight. */
  entries: EntryView[]
}

export interface ExerciseSummary {
  id: string
  name: string
  slug: string
}

export interface ExerciseListItem extends ExerciseSummary {
  seriesCount: number
  entryCount: number
  bestKg: number | null
  lastDay: Day | null
}

export interface ExerciseDetail extends ExerciseSummary {
  series: SeriesView[]
}

function toEntryView(entry: {
  id: string
  weightKg: number
  achievedOn: Date
  loggedById: string | null
}): EntryView {
  return {
    id: entry.id,
    weightKg: entry.weightKg,
    achievedOn: toDay(entry.achievedOn),
    byCoach: entry.loggedById !== null,
  }
}

function toSeriesView(series: {
  id: string
  kind: keyof typeof PR_KIND_FROM_DB
  sets: number
  reps: number
  entries: { id: string; weightKg: number; achievedOn: Date; loggedById: string | null }[]
}): SeriesView {
  const shape: SeriesShape = {
    kind: PR_KIND_FROM_DB[series.kind],
    sets: series.sets,
    reps: series.reps,
  }
  return {
    ...shape,
    id: series.id,
    key: seriesKey(shape),
    entries: series.entries.map(toEntryView),
  }
}

/** The unit this lifter reads plates in. Falls back to lb if the account has vanished. */
export async function getLiftUnit(userId: string): Promise<WeightUnit> {
  try {
    const user = await db.user.findUnique({ where: { id: userId }, select: { liftUnit: true } })
    return user ? WEIGHT_UNIT_FROM_DB[user.liftUnit] : "lb"
  } catch (error) {
    unstable_rethrow(error)
    console.error("[pr-tracker] Could not read the lift unit:", error)
    return "lb"
  }
}

/**
 * Every movement this lifter tracks, most recently touched first — the order the picker
 * shows them in, so the thing they logged yesterday is the first thing they see today.
 */
export async function listExercises(userId: string): Promise<ExerciseListItem[]> {
  const exercises = await db.exercise.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      series: {
        select: {
          id: true,
          entries: { select: { weightKg: true, achievedOn: true } },
        },
      },
    },
  })

  return exercises.map((exercise) => {
    let entryCount = 0
    let bestKg: number | null = null
    let lastDay: Day | null = null

    for (const series of exercise.series) {
      for (const entry of series.entries) {
        entryCount += 1
        if (bestKg === null || entry.weightKg > bestKg) bestKg = entry.weightKg
        const day = toDay(entry.achievedOn)
        if (lastDay === null || day > lastDay) lastDay = day
      }
    }

    return {
      id: exercise.id,
      name: exercise.name,
      slug: exercise.slug,
      seriesCount: exercise.series.length,
      entryCount,
      bestKg,
      lastDay,
    }
  })
}

/** Two records can share a day; `createdAt` keeps them in the order they were logged. */
const ENTRY_ORDER: Prisma.PrEntryOrderByWithRelationInput[] = [
  { achievedOn: "asc" },
  { createdAt: "asc" },
]

const seriesSelect = {
  id: true,
  kind: true,
  sets: true,
  reps: true,
  entries: {
    orderBy: ENTRY_ORDER,
    select: { id: true, weightKg: true, achievedOn: true, loggedById: true },
  },
} satisfies Prisma.PrSeriesSelect

/** One movement with every series and entry on it — what the View panel renders. */
export async function getExerciseDetail(
  userId: string,
  slug: string,
): Promise<ExerciseDetail | null> {
  const exercise = await db.exercise.findUnique({
    // Scoped by userId, so one lifter can never read another's records by guessing a slug.
    where: { userId_slug: { userId, slug } },
    select: {
      id: true,
      name: true,
      slug: true,
      series: {
        select: seriesSelect,
        orderBy: [{ kind: "asc" }, { sets: "asc" }, { reps: "asc" }],
      },
    },
  })
  if (!exercise) return null

  return {
    id: exercise.id,
    name: exercise.name,
    slug: exercise.slug,
    series: exercise.series.map(toSeriesView),
  }
}

/**
 * One series, for its dedicated page.
 *
 * Returns null only when the *movement* is unknown. A series with nothing left in it comes
 * back as `series: null`, because deleting your last record should say so rather than 404.
 */
export async function getSeriesDetail(userId: string, slug: string, shape: SeriesShape) {
  const exercise = await db.exercise.findUnique({
    where: { userId_slug: { userId, slug } },
    select: {
      id: true,
      name: true,
      slug: true,
      series: {
        where: { kind: PR_KIND_TO_DB[shape.kind], sets: shape.sets, reps: shape.reps },
        select: seriesSelect,
      },
    },
  })

  if (!exercise) return null

  const series = exercise.series[0]
  return {
    exercise: { id: exercise.id, name: exercise.name, slug: exercise.slug },
    series: series && series.entries.length > 0 ? toSeriesView(series) : null,
  }
}

export interface TrackerSummary {
  exerciseCount: number
  recordCount: number
  /** The earliest and latest record days across every series. */
  firstDay: Day | null
  lastDay: Day | null
}

/** The stat strip at the top of the View panel's movement list. */
export async function getTrackerSummary(userId: string): Promise<TrackerSummary> {
  const series = await db.prSeries.findMany({
    where: { userId },
    select: {
      exerciseId: true,
      entries: { select: { achievedOn: true } },
    },
  })

  const exercises = new Set<string>()
  let recordCount = 0
  let firstDay: Day | null = null
  let lastDay: Day | null = null

  for (const row of series) {
    if (row.entries.length > 0) exercises.add(row.exerciseId)
    recordCount += row.entries.length

    for (const entry of row.entries) {
      const day = toDay(entry.achievedOn)
      if (firstDay === null || day < firstDay) firstDay = day
      if (lastDay === null || day > lastDay) lastDay = day
    }
  }

  return { exerciseCount: exercises.size, recordCount, firstDay, lastDay }
}

/** The current record on a series, for the "you need to beat X" hint while typing. */
export function seriesRecord(series: Pick<SeriesView, "entries">) {
  return currentRecord(series.entries)
}

export type { PrKind }
