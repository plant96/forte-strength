import type { Day } from "@/lib/day"

/**
 * Which dates get a label on the PR chart's x axis.
 *
 * Kept apart from the chart so the rules can be tested: the chart measures itself with a
 * ResizeObserver, and under jsdom it never gets a width, so it never draws an axis at all.
 */

interface Dated {
  achievedOn: Day
}

/**
 * True when the records run across a year boundary. Expects them in date order, which is
 * how the chart already holds them.
 */
export function spansYears(entries: readonly Dated[]) {
  if (entries.length < 2) return false
  return entries[0].achievedOn.slice(0, 4) !== entries[entries.length - 1].achievedOn.slice(0, 4)
}

/**
 * How many date labels fit across a plot: between two and four. A label that carries its
 * year ("Mar 3, 2024") is roughly half as wide again as one that does not ("Mar 3"), so
 * fewer of them fit before they run into each other.
 */
export function dateTickCount(plotWidth: number, withYear: boolean) {
  const perLabel = withYear ? 84 : 60
  return Math.max(2, Math.min(4, Math.floor(plotWidth / perLabel)))
}

/**
 * Date ticks taken from the records themselves, thinned to fit. Inventing evenly spaced
 * dates would imply readings on days nothing was lifted.
 */
export function pickDateTicks(entries: readonly Dated[], count: number): Day[] {
  if (count <= 0 || entries.length === 0) return []

  // Deduplicated, because several records can share a day and a date only needs labelling
  // once — two ticks on one date would also collide as React keys.
  const days = new Set<Day>()
  if (entries.length <= count) {
    for (const entry of entries) days.add(entry.achievedOn)
    return [...days]
  }

  const step = (entries.length - 1) / (count - 1)
  for (let index = 0; index < count; index++) {
    days.add(entries[Math.round(index * step)].achievedOn)
  }
  return [...days]
}
