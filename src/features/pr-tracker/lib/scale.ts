/**
 * The two linear scales the PR chart needs, and nothing else.
 *
 * The chart is hand-drawn SVG rather than a chart library, because its whole point is a
 * celebration sequence that animates the *domain* — the axis grows to make room for a new
 * record while every mark re-projects. That needs plain functions over a domain, which is
 * all this is.
 */

export type Domain = readonly [number, number]

/** Maps a value in `domain` onto a pixel in `range`. Flat domains map to the range midpoint. */
export function project(value: number, domain: Domain, range: Domain) {
  const [d0, d1] = domain
  const [r0, r1] = range
  if (d1 === d0) return (r0 + r1) / 2
  return r0 + ((value - d0) / (d1 - d0)) * (r1 - r0)
}

/** Grows a domain by a fraction of its span on each side, so marks never touch the edge. */
export function padDomain(domain: Domain, fraction = 0.08): Domain {
  const [min, max] = domain
  const span = max - min
  if (span === 0) {
    // A single point, or several at one weight: invent a window around it so the line
    // sits mid-plot instead of on the floor.
    const pad = Math.abs(min) * 0.1 || 1
    return [min - pad, max + pad]
  }
  const pad = span * fraction
  return [min - pad, max + pad]
}

export function extent(values: readonly number[]): Domain {
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value < min) min = value
    if (value > max) max = value
  }
  return min === Infinity ? [0, 1] : [min, max]
}

/** The 1 / 2 / 5 / 10 step just above `rough`. */
function niceStep(rough: number) {
  const magnitude = 10 ** Math.floor(Math.log10(rough))
  const normalised = rough / magnitude
  if (normalised <= 1) return magnitude
  if (normalised <= 2) return 2 * magnitude
  if (normalised <= 5) return 5 * magnitude
  return 10 * magnitude
}

/**
 * Round tick values covering the domain, at roughly `count` of them. Returns only ticks
 * inside the domain, so a padded axis never draws a label off the top of the plot.
 */
export function niceTicks(domain: Domain, count = 5): number[] {
  const [min, max] = domain
  if (!Number.isFinite(min) || !Number.isFinite(max) || max === min) return [min]

  const step = niceStep((max - min) / Math.max(1, count))
  const first = Math.ceil(min / step) * step

  const ticks: number[] = []
  // A whole step of headroom past `max` would sit outside the plot; stop at the edge.
  for (let value = first; value <= max + step * 1e-9; value += step) {
    // Re-round: repeated addition of a fractional step drifts (0.1 + 0.2 ...).
    ticks.push(Number(value.toFixed(10)))
  }
  return ticks
}
