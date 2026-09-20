"use client"

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"

import { compact, formatTrafficTime, full, SERIES } from "../lib/format"
import type { RangeKey } from "../queries"

interface Point {
  bucket: string
  views: number
  visitors: number
}

/**
 * Views and unique visitors over time. Both are counts of the same thing, so
 * they share one y-axis — a second scale would invent a relationship that
 * isn't in the data.
 */
export function TrafficChart({
  data,
  range,
  timezone,
}: {
  data: Point[]
  range: RangeKey
  timezone: string
}) {
  const formatTick = (value: string) => formatTrafficTime(value, range, timezone)
  const formatFull = (value: string) => formatTrafficTime(value, range, timezone, true)

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          accessibilityLayer
          aria-label={`Page views and unique visitors over time in ${timezone}`}
          margin={{ top: 8, right: 8, bottom: 0, left: -18 }}
        >
          <defs>
            <linearGradient id="viewsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[0]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={SERIES[0]} stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={SERIES[2]} stopOpacity={0.3} />
              <stop offset="100%" stopColor={SERIES[2]} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          {/* Solid hairlines — a dashed grid reads as a threshold it isn't. */}
          <CartesianGrid
            vertical={false}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray=""
          />
          <XAxis
            dataKey="bucket"
            tickFormatter={formatTick}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={{ stroke: "var(--border)" }}
            minTickGap={24}
          />
          <YAxis
            tickFormatter={(value: number) => compact.format(value)}
            tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={48}
            allowDecimals={false}
          />
          <Tooltip
            cursor={{ stroke: "var(--muted-foreground)", strokeWidth: 1 }}
            labelFormatter={(label) => formatFull(String(label))}
            formatter={(value, name) => [full.format(Number(value)), name]}
            contentStyle={{
              background: "var(--popover)",
              border: "none",
              borderRadius: "var(--radius-md)",
              boxShadow: "0 8px 24px rgb(0 0 0 / 0.45)",
              fontSize: 12,
            }}
            labelStyle={{ color: "var(--foreground)", fontWeight: 600, marginBottom: 4 }}
            itemStyle={{ color: "var(--muted-foreground)" }}
          />
          <Area
            type="monotone"
            dataKey="views"
            name="Page views"
            stroke={SERIES[0]}
            strokeWidth={2}
            fill="url(#viewsFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
          <Area
            type="monotone"
            dataKey="visitors"
            name="Visitors"
            stroke={SERIES[2]}
            strokeWidth={2}
            fill="url(#visitorsFill)"
            activeDot={{ r: 4, strokeWidth: 2, stroke: "var(--card)" }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
