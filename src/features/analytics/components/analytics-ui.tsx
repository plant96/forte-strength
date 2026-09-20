import { cn } from "cn"
import { MinusIcon, TrendingDownIcon, TrendingUpIcon } from "lucide-react"
import Link from "next/link"

import { formatPercent } from "../lib/format"
import { RANGES, type RangeKey } from "../queries"

/** A titled panel. Every chart on the page sits in one of these. */
export function Panel({
  title,
  hint,
  children,
  className,
  action,
}: {
  title: string
  hint?: string
  children: React.ReactNode
  className?: string
  action?: React.ReactNode
}) {
  return (
    <section
      className={cn(
        "flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10",
        className,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <h2 className="font-heading text-sm font-semibold tracking-[0.15em] uppercase">
            {title}
          </h2>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

/**
 * A headline number with its period-over-period change.
 *
 * `lowerIsBetter` exists because bounce rate going up is bad while everything
 * else going up is good — the arrow direction and the colour must not disagree.
 */
export function MetricTile({
  label,
  value,
  change,
  hint,
  lowerIsBetter = false,
}: {
  label: string
  value: string
  change?: number | null
  hint?: string
  lowerIsBetter?: boolean
}) {
  const flat = change === null || change === undefined || Math.abs(change) < 0.005
  const improving =
    change !== null && change !== undefined && (lowerIsBetter ? change < 0 : change > 0)
  const Icon = flat ? MinusIcon : change! > 0 ? TrendingUpIcon : TrendingDownIcon

  return (
    <div className="flex flex-col gap-2 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="font-heading text-3xl leading-none font-bold">{value}</span>
      <span className="flex items-center gap-1.5 text-xs">
        {change === null || change === undefined ? (
          <span className="text-muted-foreground">{hint ?? "No prior period"}</span>
        ) : (
          <>
            <Icon
              className={cn(
                "size-3.5",
                flat ? "text-muted-foreground" : improving ? "text-[#0ca30c]" : "text-destructive",
              )}
              aria-hidden="true"
            />
            <span
              className={cn(
                flat ? "text-muted-foreground" : improving ? "text-[#0ca30c]" : "text-destructive",
              )}
            >
              <span className="sr-only">{flat ? "No change: " : change > 0 ? "Up " : "Down "}</span>
              {formatPercent(Math.abs(change), 0)}
            </span>
            <span className="text-muted-foreground">{hint ?? "vs previous period"}</span>
          </>
        )}
      </span>
    </div>
  )
}

export function RangePicker({
  active,
  hrefFor,
}: {
  active: RangeKey
  hrefFor: (range: RangeKey) => string
}) {
  return (
    <nav aria-label="Time range" className="flex flex-wrap gap-1 rounded-lg bg-muted/40 p-1">
      {(Object.keys(RANGES) as RangeKey[]).map((key) => {
        const current = key === active
        return (
          <Link
            key={key}
            href={hrefFor(key)}
            aria-current={current ? "page" : undefined}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium whitespace-nowrap transition-colors",
              current
                ? "bg-primary/20 text-foreground ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {RANGES[key].label}
          </Link>
        )
      })}
    </nav>
  )
}

/** Live count, with the pulse that makes "right now" legible at a glance. */
export function LiveBadge({ visitors }: { visitors: number }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-sm ring-1 ring-primary/30">
      <span className="relative flex size-2">
        {visitors > 0 && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            visitors > 0 ? "bg-primary" : "bg-muted-foreground",
          )}
        />
      </span>
      <span className="font-medium tabular-nums">{visitors}</span>
      <span className="text-muted-foreground">online now</span>
    </span>
  )
}
