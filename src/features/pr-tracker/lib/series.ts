/**
 * A "PR type" is the tuple (kind, sets, reps). It is the thing that owns a graph, and
 * the thing users must never accidentally create twice — hence the database's
 * `@@unique([exerciseId, kind, sets, reps])`.
 *
 * This module is the only place that knows how that tuple turns into a URL segment and
 * into English.
 */

/** App-level kind, kebab-case. The database enum is SCREAMING_SNAKE; see `mappers.ts`. */
export type PrKind = "one-rep-max" | "rep" | "volume"

export const PR_KINDS = ["one-rep-max", "rep", "volume"] as const satisfies readonly PrKind[]

export interface SeriesShape {
  kind: PrKind
  sets: number
  reps: number
}

/**
 * Bounds that keep the three kinds from overlapping. A 1-rep "rep PR" is a one-rep max,
 * and a 1-set "volume PR" is a rep PR — both would be a second graph for the same lift.
 */
export const SERIES_LIMITS = {
  rep: { reps: { min: 2, max: 20 } },
  volume: { sets: { min: 2, max: 12 }, reps: { min: 1, max: 20 } },
} as const

export function normaliseShape(shape: SeriesShape): SeriesShape {
  if (shape.kind === "one-rep-max") return { kind: "one-rep-max", sets: 1, reps: 1 }
  if (shape.kind === "rep") return { kind: "rep", sets: 1, reps: shape.reps }
  return shape
}

export function isValidShape(shape: SeriesShape) {
  const { kind, sets, reps } = normaliseShape(shape)
  if (!Number.isInteger(sets) || !Number.isInteger(reps)) return false
  if (kind === "one-rep-max") return sets === 1 && reps === 1
  if (kind === "rep") {
    const { min, max } = SERIES_LIMITS.rep.reps
    return sets === 1 && reps >= min && reps <= max
  }
  const limits = SERIES_LIMITS.volume
  return (
    sets >= limits.sets.min &&
    sets <= limits.sets.max &&
    reps >= limits.reps.min &&
    reps <= limits.reps.max
  )
}

/** The URL segment: `1rm`, `2rep`, `3x5`. Readable, so a shared link says what it is. */
export function seriesKey(shape: SeriesShape) {
  const { kind, sets, reps } = normaliseShape(shape)
  if (kind === "one-rep-max") return "1rm"
  if (kind === "rep") return `${reps}rep`
  return `${sets}x${reps}`
}

export function parseSeriesKey(key: string): SeriesShape | null {
  if (key === "1rm") return { kind: "one-rep-max", sets: 1, reps: 1 }

  const rep = /^(\d{1,2})rep$/.exec(key)
  if (rep) {
    const shape: SeriesShape = { kind: "rep", sets: 1, reps: Number(rep[1]) }
    return isValidShape(shape) ? shape : null
  }

  const volume = /^(\d{1,2})x(\d{1,2})$/.exec(key)
  if (volume) {
    const shape: SeriesShape = {
      kind: "volume",
      sets: Number(volume[1]),
      reps: Number(volume[2]),
    }
    return isValidShape(shape) ? shape : null
  }

  return null
}

/** "1 Rep Max", "2-Rep PR", "3x5 Volume" (with a real multiplication sign). */
export function seriesLabel(shape: SeriesShape) {
  const { kind, sets, reps } = normaliseShape(shape)
  if (kind === "one-rep-max") return "1 Rep Max"
  if (kind === "rep") return `${reps}-Rep PR`
  return `${sets}\u00d7${reps} Volume`
}

/** The short form used inside a card that already names the kind: "2 reps", "3x5". */
export function shapeChipLabel(shape: SeriesShape) {
  const { kind, sets, reps } = normaliseShape(shape)
  if (kind === "one-rep-max") return "1RM"
  if (kind === "rep") return `${reps} reps`
  return `${sets}\u00d7${reps}`
}

/** The page title: "2-Rep Bench Press". */
export function seriesTitle(exerciseName: string, shape: SeriesShape) {
  const { kind, sets, reps } = normaliseShape(shape)
  if (kind === "one-rep-max") return `${exerciseName} 1 Rep Max`
  if (kind === "rep") return `${reps}-Rep ${exerciseName}`
  return `${sets}\u00d7${reps} ${exerciseName}`
}

export const KIND_LABELS: Record<PrKind, string> = {
  "one-rep-max": "1 Rep Max",
  rep: "Rep PR",
  volume: "Volume PR",
}

export const KIND_BLURBS: Record<PrKind, string> = {
  "one-rep-max": "The heaviest single you have hit.",
  rep: "Your best weight for a set number of reps.",
  volume: "Your best weight across sets and reps.",
}
