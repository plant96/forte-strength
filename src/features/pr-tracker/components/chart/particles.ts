/**
 * The reward burst.
 *
 * `canvas-confetti` draws onto its own fixed, full-viewport canvas, which is exactly what
 * makes particles keep falling past the bottom of the chart and off the screen — a burst
 * drawn inside the chart's own SVG would be clipped at its edge.
 *
 * It is imported dynamically: it touches `window` at module scope, and it should not sit
 * in the bundle for the many pages that never celebrate anything.
 */

/** Brand red through to gold — the same heat the chart's line gradient runs on. */
const COLORS = ["#e6424c", "#fd7273", "#c98500", "#f4f4f4", "#92242c"]

export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
}

/** Viewport coordinates, normalised to the 0-1 origin canvas-confetti expects. */
function originFrom(element: Element) {
  const box = element.getBoundingClientRect()
  return {
    x: (box.left + box.width / 2) / window.innerWidth,
    y: (box.top + box.height / 2) / window.innerHeight,
  }
}

/**
 * Two staggered bursts from the new record's dot: a tight fast one that reads as the
 * impact, then a wider, slower, heavier one that arcs up and falls away.
 */
export async function burstFrom(element: Element | null) {
  if (!element || prefersReducedMotion()) return

  const { default: confetti } = await import("canvas-confetti")
  const origin = originFrom(element)

  confetti({
    origin,
    particleCount: 60,
    spread: 70,
    startVelocity: 38,
    gravity: 1.1,
    decay: 0.92,
    scalar: 0.9,
    ticks: 220,
    colors: COLORS,
    disableForReducedMotion: true,
  })

  window.setTimeout(() => {
    confetti({
      origin,
      particleCount: 35,
      spread: 110,
      startVelocity: 26,
      gravity: 0.85,
      decay: 0.94,
      scalar: 1.25,
      ticks: 300,
      colors: COLORS,
      disableForReducedMotion: true,
    })
  }, 130)
}

/**
 * The quieter first-entry cue: a few sparks drifting upward, deliberately unlike the
 * record burst so the two never read as the same achievement.
 */
export async function sparkleFrom(element: Element | null) {
  if (!element || prefersReducedMotion()) return

  const { default: confetti } = await import("canvas-confetti")

  confetti({
    origin: originFrom(element),
    particleCount: 18,
    spread: 50,
    startVelocity: 18,
    gravity: 0.35,
    decay: 0.9,
    scalar: 0.7,
    ticks: 160,
    colors: ["#f4f4f4", "#fd7273", "#c98500"],
    disableForReducedMotion: true,
  })
}
