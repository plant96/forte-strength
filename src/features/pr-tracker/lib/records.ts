import type { Day } from "@/lib/day"

/**
 * A series' line may only ever go up.
 *
 * That does not mean "heavier than everything". A record can be slotted in anywhere in
 * time, as long as it keeps the line climbing: heavier than the record before it, lighter
 * than the record after it. Appending to the end only has a "before", so it reduces to the
 * obvious rule; back-filling gets checked on both sides.
 *
 * Several records can share a day — hitting a PR and then beating it again in the same
 * session is a real thing, and it draws as a vertical step. A new record lands *after*
 * every record already on its day, so "the one before it" may well be from the same
 * morning.
 *
 * Pure and exhaustively tested, because the server action is the only thing standing
 * between this rule and a direct POST.
 */

export interface RecordPoint {
  id: string
  weightKg: number
  achievedOn: Day
}

export interface Candidate {
  weightKg: number
  achievedOn: Day
}

export type RecordVerdict =
  /** The first entry on a series: nothing to beat, so it sets the baseline. */
  | { ok: true; placement: "first"; previous: null; next: null }
  /** A new record at the end of the line — the common case. */
  | { ok: true; placement: "append"; previous: RecordPoint | null; next: null }
  /** Slotted in between two existing records, or before the earliest one. */
  | { ok: true; placement: "backfill"; previous: RecordPoint | null; next: RecordPoint }
  /** Appending something no heavier than the current record. */
  | { ok: false; reason: "not-heavier"; previous: RecordPoint }
  /** Back-filling before the earliest record, with something no lighter than it. */
  | { ok: false; reason: "not-lighter"; next: RecordPoint }
  /** Back-filling between two records, landing outside the window they leave open. */
  | { ok: false; reason: "between"; previous: RecordPoint; next: RecordPoint }

/**
 * Floats arrive from a kg conversion, so two entries that are "the same weight" can differ
 * in the last bit. A gram is far below anything a lifter can measure, and comfortably above
 * double-precision noise at these magnitudes.
 */
const EPSILON = 1e-6

function heavier(a: number, b: number) {
  return a - b > EPSILON
}

/**
 * Chronological order. `Array.prototype.sort` is stable, so records sharing a day keep the
 * order they arrived in — which, for a list read back from the database ordered by
 * `createdAt`, is the order they were logged.
 */
export function sortPoints(points: readonly RecordPoint[]) {
  return [...points].sort((a, b) =>
    a.achievedOn < b.achievedOn ? -1 : a.achievedOn > b.achievedOn ? 1 : 0,
  )
}

export function checkRecord(entries: readonly RecordPoint[], candidate: Candidate): RecordVerdict {
  const sorted = sortPoints(entries)

  if (sorted.length === 0) {
    return { ok: true, placement: "first", previous: null, next: null }
  }

  // The new record joins the end of its own day, so everything on that day counts as
  // before it and only later days count as after.
  let previous: RecordPoint | null = null
  let next: RecordPoint | null = null
  for (const entry of sorted) {
    if (entry.achievedOn <= candidate.achievedOn) previous = entry
    else if (next === null) next = entry
  }

  const tooLight = previous !== null && !heavier(candidate.weightKg, previous.weightKg)
  const tooHeavy = next !== null && !heavier(next.weightKg, candidate.weightKg)

  if (tooLight || tooHeavy) {
    if (previous && next) return { ok: false, reason: "between", previous, next }
    if (previous) return { ok: false, reason: "not-heavier", previous }
    // One of the two must exist for a failure, so `next` is non-null here.
    return { ok: false, reason: "not-lighter", next: next as RecordPoint }
  }

  if (next) return { ok: true, placement: "backfill", previous, next }
  return { ok: true, placement: "append", previous, next: null }
}

/** The heaviest entry, which for a climbing line is always the latest one. */
export function currentRecord(entries: readonly RecordPoint[]) {
  return sortPoints(entries).at(-1) ?? null
}
