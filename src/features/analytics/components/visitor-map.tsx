import { countryName, full, SCALE } from "../lib/format"
import { project, WORLD_HEIGHT, WORLD_LAND_PATH, WORLD_WIDTH } from "../lib/world-land"

export interface MapPoint {
  latitude: number
  longitude: number
  city: string | null
  country: string | null
  views: number
}

/**
 * Where visitors actually are, one dot per distinct coordinate. Dot **area**
 * scales with visits — sizing by radius would exaggerate the big ones roughly
 * quadratically.
 */
export function VisitorMap({ points }: { points: MapPoint[] }) {
  if (points.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
        <p className="font-heading text-sm font-semibold uppercase">No located visits yet</p>
        <p className="max-w-md text-sm text-muted-foreground">
          Location comes from your host&apos;s geo headers, which Vercel sets automatically. Running
          anywhere else, set <code className="text-highlight">ANALYTICS_GEOIP_ENDPOINT</code> to
          turn on lookups.
        </p>
      </div>
    )
  }

  const max = Math.max(...points.map((point) => point.views), 1)
  const total = points.reduce((sum, point) => sum + point.views, 0)

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-hidden rounded-xl bg-background/60 ring-1 ring-foreground/10">
        <svg
          viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
          className="h-auto w-full"
          role="img"
          aria-label={`World map showing ${full.format(total)} located views across ${points.length} places`}
        >
          <path d={WORLD_LAND_PATH} fill="var(--muted)" fillRule="evenodd" />
          {/* Largest first, so small dots stay clickable on top of big ones. */}
          {[...points]
            .sort((a, b) => b.views - a.views)
            .map((point) => {
              const { x, y } = project(point.longitude, point.latitude)
              const radius = 2 + Math.sqrt(point.views / max) * 9
              const index = Math.min(
                SCALE.length - 1,
                Math.floor((point.views / max) * SCALE.length),
              )
              const place =
                [point.city, point.country ? countryName(point.country) : null]
                  .filter(Boolean)
                  .join(", ") || "Unknown location"
              return (
                <circle
                  key={`${point.latitude},${point.longitude}`}
                  cx={x}
                  cy={y}
                  r={radius}
                  fill={SCALE[index]}
                  fillOpacity={0.75}
                  // A surface-coloured ring separates overlapping dots.
                  stroke="var(--background)"
                  strokeWidth={1}
                >
                  <title>{`${place} — ${full.format(point.views)} view${point.views === 1 ? "" : "s"}`}</title>
                </circle>
              )
            })}
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
        <span>
          {full.format(total)} located views · {points.length} places
        </span>
        <span className="flex items-center gap-1.5">
          Fewer
          <span className="flex gap-1">
            {SCALE.map((colour) => (
              <span key={colour} className="size-3 rounded-full" style={{ background: colour }} />
            ))}
          </span>
          More
        </span>
      </div>
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">View location counts</summary>
        <ul className="mt-3 grid max-h-64 gap-x-6 gap-y-2 overflow-y-auto sm:grid-cols-2">
          {points.map((point) => (
            <li key={`${point.latitude},${point.longitude}`} className="flex justify-between gap-3">
              <span>
                {[point.city, point.country ? countryName(point.country) : null].filter(Boolean).join(", ") || "Unknown location"}
              </span>
              <span className="shrink-0 tabular-nums">{full.format(point.views)} views</span>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}
