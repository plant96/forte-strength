"use server"

import { revalidatePath } from "next/cache"

import { WEIGHT_UNIT_TO_DB } from "@/features/profile/mappers"
import { getClientAreaUser, getCurrentUser, isAdmin } from "@/server/auth"
import { db } from "@/server/db"
import type { WeightUnit } from "@/lib/units"

import { EXERCISE_CATALOG, findCatalogEntry } from "./catalog"
import { dayToDate, formatDay } from "./lib/day"
import { checkRecord, type RecordPoint } from "./lib/records"
import { isValidShape, normaliseShape, seriesKey, type SeriesShape } from "./lib/series"
import { cleanName, matchName, slugify } from "./lib/slug"
import { formatWeight, toKg } from "./lib/weight"
import { PR_KIND_TO_DB } from "./mappers"
import { addEntrySchema, createExerciseSchema, EXERCISE_NAME_MAX } from "./schema"
import { getExerciseDetail } from "./queries"
import type { ExerciseSummary, SeriesView } from "./queries"

/**
 * Mutations for the PR tracker.
 *
 * Every one of these is a POST endpoint that anyone can hit directly, so the access check
 * lives here and not only on the page. Two shapes of caller are allowed: the athlete
 * themselves (a coaching client or an admin), and an admin logging on a client's behalf,
 * which stamps `loggedById` so the entry is visibly coach-logged.
 */

export type ActionResult<T = undefined> =
  | ({ ok: true } & (T extends undefined ? { data?: never } : { data: T }))
  | { ok: false; message: string }

interface Actor {
  /** Whose records are being changed. */
  athleteId: string
  /** The admin who logged it, or null when the athlete logged it themselves. */
  loggedById: string | null
}

/**
 * Resolves who this call may act for. Passing `athleteId` is an admin-only move; for
 * everyone else the athlete is always the signed-in user, never something the client sends.
 */
async function resolveActor(athleteId?: string): Promise<Actor | null> {
  if (athleteId) {
    const admin = await getCurrentUser()
    if (!admin || !isAdmin(admin)) return null
    const athlete = await db.user.findUnique({ where: { id: athleteId }, select: { id: true } })
    return athlete ? { athleteId: athlete.id, loggedById: admin.id } : null
  }

  const user = await getClientAreaUser()
  return user ? { athleteId: user.id, loggedById: null } : null
}

function revalidateFor(actor: Actor) {
  revalidatePath("/tools/pr-tracker", "layout")
  if (actor.loggedById) revalidatePath(`/admin/users/${actor.athleteId}/prs`, "layout")
}

const DENIED = "You need an active coaching plan to track PRs."
const GENERIC = "Something went wrong saving that. Try again in a moment."

// ---------------------------------------------------------------------------
// Movements
// ---------------------------------------------------------------------------

export type CreateExerciseResult =
  | { ok: true; status: "created" | "reused"; exercise: ExerciseSummary }
  /** Close to something that already exists — let the lifter confirm before forking a duplicate. */
  | { ok: false; status: "confirm"; typed: string; suggestions: { name: string }[] }
  | { ok: false; status: "error"; message: string }

export async function createExercise(input: {
  name: string
  force?: boolean
  athleteId?: string
}): Promise<CreateExerciseResult> {
  const actor = await resolveActor(input.athleteId)
  if (!actor) return { ok: false, status: "error", message: DENIED }

  const parsed = createExerciseSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      status: "error",
      message: `Movement names are 1–${EXERCISE_NAME_MAX} characters.`,
    }
  }

  const typed = cleanName(parsed.data.name)
  // "ohp", "rdl" and "Benchpress" all resolve to the catalogue's canonical spelling, which
  // is what silently prevents most duplicates before any warning is needed.
  const canonical = findCatalogEntry(typed)?.name ?? typed

  try {
    const existing = await db.exercise.findMany({
      where: { userId: actor.athleteId },
      select: { id: true, name: true, slug: true },
    })

    const exact = matchName(canonical, existing)
    if (exact.kind === "exact") {
      return { ok: true, status: "reused", exercise: exact.match }
    }

    if (!parsed.data.force) {
      const near = matchName(canonical, [...existing, ...EXERCISE_CATALOG])
      if (near.kind === "near") {
        return {
          ok: false,
          status: "confirm",
          typed: canonical,
          suggestions: near.matches.slice(0, 3).map((match) => ({ name: match.name })),
        }
      }
    }

    const exercise = await db.exercise.create({
      data: { userId: actor.athleteId, name: canonical, slug: slugify(canonical) },
      select: { id: true, name: true, slug: true },
    })

    revalidateFor(actor)
    return { ok: true, status: "created", exercise }
  } catch (error) {
    // The unique index is the real guarantee: if two tabs race, the loser lands here and
    // reads back the winner rather than showing an error.
    const fallback = await db.exercise
      .findUnique({
        where: { userId_slug: { userId: actor.athleteId, slug: slugify(canonical) } },
        select: { id: true, name: true, slug: true },
      })
      .catch(() => null)
    if (fallback) return { ok: true, status: "reused", exercise: fallback }

    console.error("[pr-tracker] Could not create the movement:", error)
    return { ok: false, status: "error", message: "Couldn't add that movement. Try again." }
  }
}

/**
 * The PR types already on a movement, fetched once the lifter picks it.
 *
 * A read behind an action rather than a prop: the add panel is a client component, and the
 * series it needs are only known after a choice it makes. Access is re-checked here, so it
 * cannot be used to read another lifter's history.
 */
export async function loadExerciseSeries(slug: string, athleteId?: string): Promise<SeriesView[]> {
  const actor = await resolveActor(athleteId)
  if (!actor) return []

  try {
    const detail = await getExerciseDetail(actor.athleteId, slug)
    return detail?.series ?? []
  } catch (error) {
    console.error("[pr-tracker] Could not load the movement:", error)
    return []
  }
}

// ---------------------------------------------------------------------------
// Records
// ---------------------------------------------------------------------------

export interface AddEntryOutcome {
  exercise: ExerciseSummary
  series: SeriesView
  entryId: string
  /** Drives which celebration plays. */
  placement: "first" | "append" | "backfill"
  /** The record this one beat, for the delta chip. Null on a first entry or an early back-fill. */
  previousKg: number | null
  /** True when another record already sits on this day, so the line steps straight up. */
  sameDay: boolean
}

export type AddEntryResult =
  | { ok: true; data: AddEntryOutcome }
  /** The rule was broken — `field` says which input to attach the message to. */
  | { ok: false; field: "weight" | "achievedOn" | null; message: string }

export async function addPrEntry(input: unknown): Promise<AddEntryResult> {
  const parsed = addEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, field: null, message: "Check the values and try again." }
  }

  const actor = await resolveActor(parsed.data.athleteId)
  if (!actor) return { ok: false, field: null, message: DENIED }

  const shape = normaliseShape({
    kind: parsed.data.kind,
    sets: parsed.data.sets,
    reps: parsed.data.reps,
  })
  if (!isValidShape(shape)) {
    return { ok: false, field: null, message: "That isn't a valid PR type." }
  }

  const weightKg = toKg(parsed.data.weight, parsed.data.unit)
  const achievedOn = parsed.data.achievedOn

  try {
    // Scoped by athlete, so an id from the client can only ever reach their own movements.
    const exercise = await db.exercise.findFirst({
      where: { id: parsed.data.exerciseId, userId: actor.athleteId },
      select: { id: true, name: true, slug: true },
    })
    if (!exercise) return { ok: false, field: null, message: "That movement no longer exists." }

    const outcome = await db.$transaction(async (tx) => {
      // The unique index on (exerciseId, kind, sets, reps) is what makes a duplicate PR
      // type impossible; upsert turns that guarantee into "reuse the existing one".
      const series = await tx.prSeries.upsert({
        where: {
          exerciseId_kind_sets_reps: {
            exerciseId: exercise.id,
            kind: PR_KIND_TO_DB[shape.kind],
            sets: shape.sets,
            reps: shape.reps,
          },
        },
        create: {
          exerciseId: exercise.id,
          userId: actor.athleteId,
          kind: PR_KIND_TO_DB[shape.kind],
          sets: shape.sets,
          reps: shape.reps,
        },
        update: {},
        select: { id: true },
      })

      const existing = await tx.prEntry.findMany({
        where: { seriesId: series.id },
        // Two records can share a day, so `createdAt` decides which came second.
        orderBy: [{ achievedOn: "asc" }, { createdAt: "asc" }],
        select: { id: true, weightKg: true, achievedOn: true, loggedById: true },
      })

      const points: RecordPoint[] = existing.map((entry) => ({
        id: entry.id,
        weightKg: entry.weightKg,
        achievedOn: entry.achievedOn.toISOString().slice(0, 10),
      }))

      const verdict = checkRecord(points, { weightKg, achievedOn })
      // Tagged at the top level: a nested discriminant would not narrow the sibling
      // fields once this value crosses back out of the transaction.
      if (!verdict.ok) return { status: "refused" as const, verdict }

      const entry = await tx.prEntry.create({
        data: {
          seriesId: series.id,
          userId: actor.athleteId,
          weightKg,
          achievedOn: dayToDate(achievedOn),
          loggedById: actor.loggedById,
        },
        select: { id: true },
      })

      // Bumps the movement to the top of the picker, so the lift they just trained is the
      // first one offered next time.
      await tx.exercise.update({ where: { id: exercise.id }, data: { updatedAt: new Date() } })

      const entries = await tx.prEntry.findMany({
        where: { seriesId: series.id },
        orderBy: [{ achievedOn: "asc" }, { createdAt: "asc" }],
        select: { id: true, weightKg: true, achievedOn: true, loggedById: true },
      })

      return {
        status: "saved" as const,
        placement: verdict.placement,
        previousKg: verdict.previous?.weightKg ?? null,
        sameDay: points.some((point) => point.achievedOn === achievedOn),
        seriesId: series.id,
        entryId: entry.id,
        entries,
      }
    })

    if (outcome.status === "refused") {
      return describeRefusal(outcome.verdict, parsed.data.unit)
    }

    const view: SeriesView = {
      ...shape,
      id: outcome.seriesId,
      key: seriesKey(shape),
      entries: outcome.entries.map((entry) => ({
        id: entry.id,
        weightKg: entry.weightKg,
        achievedOn: entry.achievedOn.toISOString().slice(0, 10),
        byCoach: entry.loggedById !== null,
      })),
    }

    revalidateFor(actor)

    return {
      ok: true,
      data: {
        exercise,
        series: view,
        entryId: outcome.entryId,
        placement: outcome.placement,
        previousKg: outcome.previousKg,
        sameDay: outcome.sameDay,
      },
    }
  } catch (error) {
    console.error("[pr-tracker] Could not log the record:", error)
    return { ok: false, field: null, message: GENERIC }
  }
}

/**
 * Turns a broken rule into something a person would say. The rule itself lives in
 * `lib/records.ts`; only the wording is here, so the logic stays testable without strings.
 */
function describeRefusal(
  verdict: Extract<ReturnType<typeof checkRecord>, { ok: false }>,
  unit: WeightUnit,
): AddEntryResult {
  if (verdict.reason === "not-heavier") {
    return {
      ok: false,
      field: "weight",
      message: `Your record here is ${formatWeight(verdict.previous.weightKg, unit)}, set ${formatDay(verdict.previous.achievedOn)}. Log something heavier to beat it.`,
    }
  }

  if (verdict.reason === "not-lighter") {
    return {
      ok: false,
      field: "weight",
      message: `Your earliest record is ${formatWeight(verdict.next.weightKg, unit)} on ${formatDay(verdict.next.achievedOn)}. Anything before that has to be lighter.`,
    }
  }

  return {
    ok: false,
    field: "weight",
    message: `On ${formatDay(verdict.previous.achievedOn)} you were at ${formatWeight(verdict.previous.weightKg, unit)}, and by ${formatDay(verdict.next.achievedOn)} you had hit ${formatWeight(verdict.next.weightKg, unit)}. A record in between has to land between them.`,
  }
}

export async function deletePrEntry(input: {
  entryId: string
  athleteId?: string
}): Promise<ActionResult> {
  const actor = await resolveActor(input.athleteId)
  if (!actor) return { ok: false, message: DENIED }

  try {
    // Ownership comes from the session, never from the payload.
    const entry = await db.prEntry.findFirst({
      where: { id: input.entryId, userId: actor.athleteId },
      select: { id: true, seriesId: true },
    })
    if (!entry) return { ok: false, message: "That record has already been removed." }

    await db.$transaction(async (tx) => {
      await tx.prEntry.delete({ where: { id: entry.id } })
      // A PR type with no records left is clutter in every picker and column, so it goes
      // with its last entry. The movement itself stays — they may well log it again.
      const remaining = await tx.prEntry.count({ where: { seriesId: entry.seriesId } })
      if (remaining === 0) await tx.prSeries.delete({ where: { id: entry.seriesId } })
    })

    revalidateFor(actor)
    return { ok: true }
  } catch (error) {
    console.error("[pr-tracker] Could not delete the record:", error)
    return { ok: false, message: "Couldn't remove that record. Try again." }
  }
}

/** The lifter's own gym-weight preference. Admins change their own, never a client's. */
export async function setLiftUnit(unit: WeightUnit): Promise<ActionResult> {
  const user = await getClientAreaUser()
  if (!user) return { ok: false, message: DENIED }

  try {
    await db.user.update({ where: { id: user.id }, data: { liftUnit: WEIGHT_UNIT_TO_DB[unit] } })
  } catch (error) {
    console.error("[pr-tracker] Could not save the weight unit:", error)
    return { ok: false, message: "Couldn't save that preference." }
  }

  revalidatePath("/tools/pr-tracker", "layout")
  return { ok: true }
}

export type { SeriesShape }
