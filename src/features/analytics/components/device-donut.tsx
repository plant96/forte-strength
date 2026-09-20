"use client"

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

import { formatPercent, full, SERIES } from "../lib/format"
import type { Breakdown } from "../queries"

const LABELS: Record<string, string> = {
  DESKTOP: "Desktop",
  MOBILE: "Mobile",
  TABLET: "Tablet",
  BOT: "Bot",
  UNKNOWN: "Unknown",
}

/**
 * Part-to-whole across a handful of device classes — the one case a donut earns
 * its place. Falls back to a plain figure when there's only one class, since a
 * single-slice donut is just a number drawn slowly.
 */
export function DeviceDonut({ rows }: { rows: Breakdown[] }) {
  const data = rows.map((row) => ({ ...row, label: LABELS[row.label] ?? row.label }))
  const total = data.reduce((sum, row) => sum + row.views, 0)

  if (total === 0) {
    return <p className="py-10 text-center text-sm text-muted-foreground">No data yet</p>
  }

  if (data.length === 1) {
    return (
      <div className="flex flex-col items-center gap-1 py-8">
        <span className="font-heading text-4xl leading-none font-bold">{data[0].label}</span>
        <span className="text-sm text-muted-foreground">
          every visit so far ({full.format(total)})
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <div className="h-44 w-full sm:w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="views"
              nameKey="label"
              innerRadius="58%"
              outerRadius="90%"
              // A surface-coloured gap separates slices instead of a border.
              stroke="var(--card)"
              strokeWidth={2}
            >
              {data.map((row, index) => (
                <Cell key={row.label} fill={SERIES[index % SERIES.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [
                `${full.format(Number(value))} (${formatPercent(Number(value) / total, 0)})`,
                name,
              ]}
              contentStyle={{
                background: "var(--popover)",
                border: "none",
                borderRadius: "var(--radius-md)",
                boxShadow: "0 8px 24px rgb(0 0 0 / 0.45)",
                fontSize: 12,
              }}
              itemStyle={{ color: "var(--muted-foreground)" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Identity never rests on colour alone: the legend names every slice. */}
      <ul className="flex flex-1 flex-col gap-2">
        {data.map((row, index) => (
          <li key={row.label} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="size-2.5 shrink-0 rounded-full"
              style={{ background: SERIES[index % SERIES.length] }}
            />
            <span className="flex-1 text-foreground">{row.label}</span>
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatPercent(row.views / total, 0)}
            </span>
            <span className="w-12 text-right font-medium tabular-nums">
              {full.format(row.views)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
