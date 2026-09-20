/**
 * Name normalisation, which is most of what stops duplicate movements existing.
 *
 * Three forms, each with a job:
 * - `cleanName`  what gets stored and shown, exactly as typed but tidied.
 * - `slugify`    the stable identity behind `Exercise.slug` and the URL.
 * - `compactName` the loosest form, used to decide whether two names *mean* the same
 *   thing. "Bench Press", "bench-press" and "BENCH  PRESS" all collapse onto it.
 */

/** Trimmed, with runs of inner whitespace collapsed to one space. */
export function cleanName(name: string) {
  return name.trim().replace(/\s+/g, " ")
}

function foldAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

/** Lowercase, accent-free, hyphenated: "Bulgarian Split Squat" -> "bulgarian-split-squat". */
export function slugify(name: string) {
  return foldAccents(cleanName(name))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

/**
 * Letters and digits only. This is what makes "Benchpress" and "Bench Press" the same
 * movement rather than two: they differ only in separators, which carry no meaning here.
 */
export function compactName(name: string) {
  return foldAccents(name)
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
}

/** Classic Levenshtein distance, with a two-row buffer so long lists stay cheap. */
export function levenshtein(a: string, b: string) {
  if (a === b) return 0
  if (!a.length) return b.length
  if (!b.length) return a.length

  let previous = Array.from({ length: b.length + 1 }, (_, i) => i)
  let current = new Array<number>(b.length + 1)

  for (let i = 1; i <= a.length; i++) {
    current[0] = i
    for (let j = 1; j <= b.length; j++) {
      const substitution = previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, substitution)
    }
    const swap = previous
    previous = current
    current = swap
  }

  return previous[b.length]
}

export interface NamedThing {
  name: string
}

/**
 * How a typed name relates to the movements that already exist.
 *
 * - `exact`   the same movement under different punctuation. Reuse it silently; there is
 *             nothing for the user to decide.
 * - `near`    close enough to be a typo ("Benchpress" for "Bench Press"). Worth a confirm.
 * - `none`    genuinely new.
 *
 * Short names are held to a tighter distance, because at four characters a distance of two
 * is a different word ("curl" vs "hurl"), not a slip.
 */
export type NameMatch<T extends NamedThing> =
  { kind: "exact"; match: T } | { kind: "near"; matches: T[] } | { kind: "none" }

function allowedDistance(compact: string) {
  if (compact.length <= 4) return 0
  if (compact.length <= 7) return 1
  return 2
}

export function matchName<T extends NamedThing>(
  name: string,
  candidates: readonly T[],
): NameMatch<T> {
  const compact = compactName(name)
  if (!compact) return { kind: "none" }

  const exact = candidates.find((candidate) => compactName(candidate.name) === compact)
  if (exact) return { kind: "exact", match: exact }

  const limit = allowedDistance(compact)
  if (limit === 0) return { kind: "none" }

  const matches = candidates
    .map((candidate) => ({
      candidate,
      distance: levenshtein(compact, compactName(candidate.name)),
    }))
    .filter((scored) => scored.distance <= limit)
    .sort((a, b) => a.distance - b.distance)
    .map((scored) => scored.candidate)

  return matches.length ? { kind: "near", matches } : { kind: "none" }
}
