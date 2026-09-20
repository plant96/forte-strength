import { compact, formatPercent, full } from "../lib/format"
import type { Breakdown } from "../queries"

/**
 * A ranked list with the bar drawn behind the label. Every bar is the same
 * colour: these categories have no natural order, so shading by size would
 * double-encode the length the bar already shows.
 */
export function StatBars({
  rows,
  total,
  renderLabel,
  emptyLabel = "No data yet",
}: {
  rows: Breakdown[]
  /** Denominator for the share, so bars stay comparable across cards. */
  total?: number
  renderLabel?: (row: Breakdown) => React.ReactNode
  emptyLabel?: string
}) {
  if (rows.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">{emptyLabel}</p>
  }

  const max = Math.max(...rows.map((row) => row.views), 1)
  const denominator = total || rows.reduce((sum, row) => sum + row.views, 0) || 1

  return (
    <ul className="flex flex-col gap-1">
      {rows.map((row) => {
        const share = row.views / denominator
        return (
          <li
            key={row.label}
            className="relative isolate flex items-center justify-between gap-3 overflow-hidden rounded-md px-2.5 py-1.5 text-sm"
            title={`${row.label} — ${full.format(row.views)} views, ${full.format(row.visitors)} visitors (${formatPercent(share)})`}
          >
            <span
              aria-hidden="true"
              className="absolute inset-y-0 left-0 -z-10 rounded-md bg-chart-1/20"
              style={{ width: `${Math.max((row.views / max) * 100, 1.5)}%` }}
            />
            <span className="min-w-0 truncate text-foreground">
              {renderLabel ? renderLabel(row) : row.label}
            </span>
            <span className="flex shrink-0 items-baseline gap-2 tabular-nums">
              <span className="text-xs text-muted-foreground">{formatPercent(share, 0)}</span>
              <span className="font-medium text-foreground">{compact.format(row.views)}</span>
            </span>
          </li>
        )
      })}
    </ul>
  )
}
