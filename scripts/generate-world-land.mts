/**
 * Regenerates `src/features/analytics/lib/world-land.ts`.
 *
 * Run with `pnpm tsx scripts/generate-world-land.mts`.
 *
 * The land path and the `project()` the dots use have to agree exactly, so both come from
 * the constants below and this file is the only place either is decided. They did once
 * drift apart — the path was emitted in whole-globe coordinates while `project()` measured
 * from a cropped window, which left every visitor dot about a degree and a half north of
 * the ground it happened on.
 *
 * Two details this handles that a naive projection does not:
 *
 * - **The antimeridian.** Eurasia's ring runs past 180°E and resumes at -180°, and a ring
 *   projected point by point draws a straight line all the way back across the map. Here
 *   longitudes are unwrapped so each ring stays continuous, then drawn again shifted a full
 *   turn each way; the viewBox crops whatever lands outside.
 * - **The latitude crop.** Latitudes are clamped rather than dropped, so a landmass running
 *   off the top or bottom keeps a closed outline along the edge instead of springing a leak.
 */
import { writeFileSync } from "node:fs"
import { createRequire } from "node:module"

import * as topojson from "topojson-client"

const require = createRequire(import.meta.url)

/** The window the map shows. Antarctica sits below it, which is why it is not drawn. */
const LAT_TOP = 84
const LAT_BOTTOM = -58
const WORLD_WIDTH = 1000
const WORLD_HEIGHT = Number(((WORLD_WIDTH / 360) * (LAT_TOP - LAT_BOTTOM)).toFixed(1))

const project = (longitude: number, latitude: number) => ({
  x: ((longitude + 180) / 360) * WORLD_WIDTH,
  y: ((LAT_TOP - latitude) / (LAT_TOP - LAT_BOTTOM)) * WORLD_HEIGHT,
})

const round = (value: number) => Number(value.toFixed(1))

type Ring = [number, number][]

/** Makes a ring continuous across the antimeridian by letting longitude run past ±180. */
function unwrap(ring: Ring): Ring {
  let offset = 0
  return ring.map(([longitude, latitude], index) => {
    if (index > 0) {
      const previous = ring[index - 1][0]
      const delta = longitude - previous
      if (delta > 180) offset -= 360
      else if (delta < -180) offset += 360
    }
    return [longitude + offset, latitude]
  })
}

function toPath(ring: Ring, shift: number) {
  const points = ring.map(([longitude, latitude]) => {
    // Clamping rather than discarding keeps the outline closed along the crop.
    const clamped = Math.min(LAT_TOP, Math.max(LAT_BOTTOM, latitude))
    const { x, y } = project(longitude + shift, clamped)
    return `${round(x)} ${round(y)}`
  })

  // Collapse the runs of identical points that clamping leaves behind.
  const deduped = points.filter((point, index) => point !== points[index - 1])
  if (deduped.length < 3) return ""
  return `M${deduped.join("L")}Z`
}

const topology = require("world-atlas/land-110m.json")
// `objects.land` is a GeometryCollection, so this comes back as a FeatureCollection whose
// single feature holds every landmass as one MultiPolygon.
const collection = topojson.feature(topology, topology.objects.land) as unknown as {
  features: { geometry: { type: string; coordinates: Ring[] | Ring[][] } }[]
}

const rings: Ring[] = collection.features.flatMap((feature) =>
  // A Polygon's coordinates are its rings; a MultiPolygon's are rings one level deeper.
  feature.geometry.type === "MultiPolygon"
    ? (feature.geometry.coordinates as Ring[][]).flat()
    : (feature.geometry.coordinates as Ring[]),
)

let path = ""
let kept = 0
for (const raw of rings) {
  const latitudes = raw.map(([, latitude]) => latitude)
  // Entirely outside the window — Antarctica, and nothing else at this resolution.
  if (Math.max(...latitudes) < LAT_BOTTOM || Math.min(...latitudes) > LAT_TOP) continue

  const ring = unwrap(raw)
  const longitudes = ring.map(([longitude]) => longitude)
  const min = Math.min(...longitudes)
  const max = Math.max(...longitudes)

  // The ring itself, plus a turn either way for anything that crossed the antimeridian.
  const shifts = [0]
  if (max > 180) shifts.push(-360)
  if (min < -180) shifts.push(360)

  for (const shift of shifts) {
    const drawn = toPath(ring, shift)
    if (drawn) {
      path += drawn
      kept++
    }
  }
}

const file = `/**
 * World landmasses as a single SVG path, in an equirectangular projection
 * cropped to latitudes ${LAT_TOP}°N–${Math.abs(LAT_BOTTOM)}°S.
 *
 * Generated from Natural Earth 1:110m via the \`world-atlas\` package — do not
 * hand-edit. Run \`pnpm tsx scripts/generate-world-land.mts\` instead, which also
 * owns \`project()\` below so the land and the dots can never disagree again.
 * Coordinates are rounded to 0.1 units, well under a pixel at the size this renders.
 */
export const WORLD_WIDTH = ${WORLD_WIDTH}
export const WORLD_HEIGHT = ${WORLD_HEIGHT}
export const LAT_TOP = ${LAT_TOP}
export const LAT_BOTTOM = ${LAT_BOTTOM}

/** Longitude/latitude to a point in the \`${WORLD_WIDTH}×${WORLD_HEIGHT}\` viewBox. */
export function project(longitude: number, latitude: number) {
  return {
    x: ((longitude + 180) / 360) * WORLD_WIDTH,
    y: ((LAT_TOP - latitude) / (LAT_TOP - LAT_BOTTOM)) * WORLD_HEIGHT,
  }
}

export const WORLD_LAND_PATH =
  "${path}"
`

writeFileSync("src/features/analytics/lib/world-land.ts", file)
console.log(`wrote ${kept} rings, ${(path.length / 1024).toFixed(1)} KB of path`)
console.log(`viewBox 0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`)
