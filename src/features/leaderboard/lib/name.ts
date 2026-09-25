/**
 * How a lifter is named on the public boards: first name and last initial only, so a
 * teammate recognises them without their full name being published. Email never appears.
 */

function initial(name: string) {
  return [...name][0]!.toUpperCase()
}

const clean = (value: string | null | undefined) => value?.trim() || null

/** "Tyler M.", or just "Tyler" without a last name, or "Athlete" without any. */
export function leaderboardName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
) {
  const first = clean(firstName)
  const last = clean(lastName)
  if (first && last) return `${first} ${initial(last)}.`
  if (first) return first
  return "Athlete"
}

/** "TM", or "T" without a last name, or "A" for an unnamed "Athlete". */
export function initialsFor(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
) {
  const first = clean(firstName)
  const last = clean(lastName)
  if (!first) return "A"
  return last ? `${initial(first)}${initial(last)}` : initial(first)
}
