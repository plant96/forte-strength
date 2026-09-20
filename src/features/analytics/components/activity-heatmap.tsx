import { full, SCALE, WEEKDAYS } from "../lib/format"

/** Sequential bins: one hue, dimmest to brightest, with an explicit scale legend. */
function bucketFor(views: number, max: number) {
  if (views === 0) return null
  const ratio = views / max
  const index = Math.min(SCALE.length - 1, Math.floor(ratio * SCALE.length))
  return SCALE[index]
}

/**
 * When traffic actually arrives, by local hour and weekday. Cells are a
 * sequential ramp because the value is one continuous magnitude.
 */
export function ActivityHeatmap({
  data,
  timezone,
}: {
  data: { weekday: number; hour: number; views: number }[]
  timezone: string
}) {
  const grid = new Map<string, number>()
  for (const row of data) grid.set(`${row.weekday}-${row.hour}`, row.views)
  const max = Math.max(...data.map((row) => row.views), 1)
  const hasData = data.length > 0

  if (!hasData) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="overflow-x-auto">
        <div className="min-w-125">
          <div
            role="table"
            aria-label={`Page views by weekday and hour in ${timezone}`}
            className="flex flex-col gap-1"
          >
            {WEEKDAYS.map((day, weekday) => (
              <div key={day} role="row" className="flex items-center gap-1">
                <span role="rowheader" className="w-9 shrink-0 text-[0.7rem] text-muted-foreground">{day}</span>
                <div className="flex flex-1 gap-1">
                  {Array.from({ length: 24 }, (_, hour) => {
                    const views = grid.get(`${weekday}-${hour}`) ?? 0
                    const background = bucketFor(views, max)
                    return (
                      <div
                        key={hour}
                        role="cell"
                        aria-label={`${day} ${hour}:00 — ${full.format(views)} view${views === 1 ? "" : "s"}`}
                        title={`${day} ${hour}:00 — ${full.format(views)} view${views === 1 ? "" : "s"}`}
                        className="h-5 flex-1 rounded-[3px] ring-1 ring-foreground/5"
                        style={{ background: background ?? "var(--muted)" }}
                      />
                    )
                  })}
                </div>
              </div>
            ))}
            <div role="row" className="flex items-center gap-1 pt-0.5">
              <span role="columnheader" className="w-9 shrink-0"><span className="sr-only">Weekday</span></span>
              <div className="flex flex-1 gap-1">
                {Array.from({ length: 24 }, (_, hour) => (
                  <span
                    key={hour}
                    role="columnheader"
                    aria-label={`${hour}:00`}
                    className="flex-1 text-center text-[0.6rem] text-muted-foreground tabular-nums"
                  >
                    {hour % 6 === 0 ? hour : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
        <span>Hour of day · {timezone}</span>
        <span className="flex items-center gap-1.5">
          Less
          <span className="flex gap-1">
            <span className="size-3 rounded-[3px] bg-muted" />
            {SCALE.map((colour) => (
              <span key={colour} className="size-3 rounded-[3px]" style={{ background: colour }} />
            ))}
          </span>
          More
        </span>
      </div>
    </div>
  )
}
