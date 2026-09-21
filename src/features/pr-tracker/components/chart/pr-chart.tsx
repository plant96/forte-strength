"use client"

import { cn } from "cn"
import { animate, m, useReducedMotion } from "motion/react"
import { useEffect, useId, useRef, useState } from "react"

import type { WeightUnit } from "@/lib/units"

import { dayToDate, formatDay, formatDayShort, type Day } from "@/lib/day"
import { extent, niceTicks, padDomain, project, type Domain } from "../../lib/scale"
import { dateTickCount, pickDateTicks, spansYears } from "../../lib/ticks"
import { formatDelta, formatWeightValue, fromKg } from "../../lib/weight"
import type { EntryView } from "../../queries"
import { burstFrom, prefersReducedMotion, sparkleFrom } from "./particles"

/**
 * The PR line, drawn by hand rather than with a chart library.
 *
 * The reason is the celebration: when a record lands, the *axis itself* has to grow to
 * make room for it while every existing mark re-projects onto the new domain, then the new
 * segment draws, then the dot lands, then particles fire from that dot's real pixel
 * position. A chart library owns its own animation timeline and redraws the line whenever
 * the data changes, which makes that sequence impossible to place frame by frame. A single
 * date-to-weight series needs only two linear scales, so drawing it directly is cheap.
 *
 * The same component renders every surface — the add panel, the view panel, a series page,
 * the admin's view of a client — with `celebrate` left null everywhere but the add panel.
 */

export interface CelebrateSpec {
  entryId: string
  placement: "first" | "append" | "backfill"
}

interface PrChartProps {
  entries: EntryView[]
  unit: WeightUnit
  celebrate?: CelebrateSpec | null
  height?: number
  /** Hides axes and chrome, for the small previews in the series columns. */
  spark?: boolean
  onCelebrationEnd?: () => void
  className?: string
  label?: string
}

type Phase = "grow" | "draw" | "land" | "done"

interface Point {
  entry: EntryView
  x: number
  y: number
}

const PAD = { top: 30, right: 22, bottom: 26, left: 46 }
const SPARK_PAD = { top: 6, right: 6, bottom: 6, left: 6 }

/** How long the line takes to draw itself when a chart first appears. */
const INTRO_DRAW = 0.8

/**
 * How near a tap has to land to count as picking that record. Generous, because a finger
 * is wider than an 8px dot — but not so generous that a tap meant to dismiss picks
 * something instead.
 */
const TAP_RADIUS = 34

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpDomain(a: Domain, b: Domain, t: number): Domain {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]
}

function timeOf(day: Day) {
  return dayToDate(day).getTime()
}

function pathFrom(points: Point[]) {
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ")
}

/** Tracks the container's width so text renders at its true size instead of being scaled. */
function useMeasuredWidth() {
  const ref = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      setWidth(entry.contentRect.width)
    })
    observer.observe(node)
    setWidth(node.getBoundingClientRect().width)
    return () => observer.disconnect()
  }, [])

  return [ref, width] as const
}

export function PrChart({
  entries,
  unit,
  celebrate = null,
  height = 280,
  spark = false,
  onCelebrationEnd,
  className,
  label,
}: PrChartProps) {
  const gradientId = useId()
  const [containerRef, width] = useMeasuredWidth()
  const newDotRef = useRef<SVGGElement>(null)
  const reduceMotion = useReducedMotion()

  /**
   * A chart that is only being read still draws itself in rather than snapping into place:
   * the line is a story about getting stronger, and watching it arrive says so. This is the
   * quiet version — no domain growth, no particles. A celebration owns the whole sequence
   * itself, and a sparkline is too small for the movement to read as anything but noise.
   */
  const intro = !celebrate && !spark && !reduceMotion

  // `grow` drives the domain interpolation, so the axis, the grid and every existing mark
  // move together. It starts at 0 only when there is a previous state to grow out of.
  const [grow, setGrow] = useState(celebrate && celebrate.placement !== "first" ? 0 : 1)
  const [phase, setPhase] = useState<Phase>(celebrate ? "grow" : "done")
  const [hovered, setHovered] = useState<number | null>(null)
  // Tapped open, and stays open. Touch has no hover, so the tooltip needs a way to be
  // asked for; pinning also helps on a mouse when you want to read a point without
  // holding the cursor perfectly still.
  const [pinned, setPinned] = useState<number | null>(null)

  // Records can share a day, and the order within that day is the order they were logged.
  // Returning 0 for equal days keeps the sort stable so that order survives.
  const sorted = [...entries].sort((a, b) =>
    a.achievedOn < b.achievedOn ? -1 : a.achievedOn > b.achievedOn ? 1 : 0,
  )
  const newIndex = celebrate ? sorted.findIndex((entry) => entry.id === celebrate.entryId) : -1
  const before = newIndex >= 0 ? sorted.filter((_, index) => index !== newIndex) : sorted

  // Which marks exist yet: until the new point lands, the chart is exactly what the lifter
  // last saw.
  const settled = phase === "land" || phase === "done"
  const visible = celebrate && !settled ? before : sorted

  const pad = spark ? SPARK_PAD : PAD
  const plotWidth = Math.max(0, width - pad.left - pad.right)
  const plotHeight = Math.max(0, height - pad.top - pad.bottom)

  const fullX = padDomain(extent(sorted.map((entry) => timeOf(entry.achievedOn))), 0.06)
  const fullY = padDomain(
    extent(sorted.map((entry) => fromKg(entry.weightKg, unit))),
    spark ? 0.12 : 0.18,
  )
  const hasBefore = before.length > 0
  const startX = hasBefore
    ? padDomain(extent(before.map((entry) => timeOf(entry.achievedOn))), 0.06)
    : fullX
  const startY = hasBefore
    ? padDomain(extent(before.map((entry) => fromKg(entry.weightKg, unit))), spark ? 0.12 : 0.18)
    : fullY

  const xDomain = lerpDomain(startX, fullX, grow)
  const yDomain = lerpDomain(startY, fullY, grow)

  const toPoint = (entry: EntryView): Point => ({
    entry,
    x: pad.left + project(timeOf(entry.achievedOn), xDomain, [0, plotWidth]),
    y: pad.top + project(fromKg(entry.weightKg, unit), yDomain, [plotHeight, 0]),
  })

  const points = visible.map(toPoint)
  const allPoints = sorted.map(toPoint)
  const newPoint = newIndex >= 0 ? allPoints[newIndex] : null
  const latest = allPoints.at(-1) ?? null

  // The segment(s) the new record adds: one when it lands at the end, two when it slots in
  // between existing records and the line re-routes through it.
  const newSegment: Point[] =
    newPoint && newIndex >= 0
      ? [allPoints[newIndex - 1], newPoint, allPoints[newIndex + 1]].filter(Boolean as never)
      : []

  useEffect(() => {
    if (!celebrate) return

    let cancelled = false
    let growth: ReturnType<typeof animate> | null = null
    const timers: number[] = []
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        timers.push(window.setTimeout(resolve, ms))
      })

    async function run() {
      // Someone who has asked for less motion still gets the record, just not the show.
      if (prefersReducedMotion()) {
        setGrow(1)
        setPhase("done")
        onCelebrationEnd?.()
        return
      }

      if (celebrate!.placement === "first") {
        // Nothing to grow out of: the dot simply arrives and sets the baseline.
        setPhase("land")
        await wait(560)
        if (cancelled) return
        void sparkleFrom(newDotRef.current)
        setPhase("done")
        onCelebrationEnd?.()
        return
      }

      // 1. Hold on the old chart for a beat, so the growth reads as a change.
      await wait(220)
      if (cancelled) return

      // 2. The axis opens up to make room. Every existing mark re-projects as it does.
      growth = animate(0, 1, {
        duration: 0.75,
        ease: [0.16, 1, 0.3, 1],
        onUpdate: (value) => {
          if (!cancelled) setGrow(value)
        },
      })
      await growth.finished
      if (cancelled) return

      // 3. The new stretch of line draws itself.
      setPhase("draw")
      await wait(470)
      if (cancelled) return

      // 4. The dot lands, and the burst comes off it.
      setPhase("land")
      await wait(240)
      if (cancelled) return
      void burstFrom(newDotRef.current)
      setPhase("done")
      onCelebrationEnd?.()
    }

    void run()
    return () => {
      cancelled = true
      growth?.stop()
      for (const timer of timers) window.clearTimeout(timer)
    }
    // A celebration is keyed to one entry; re-running it on unrelated re-renders would
    // replay the confetti.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrate?.entryId])

  const yTicks = niceTicks(yDomain, 4)
  // Judged on every record rather than the visible ones, so the label format does not
  // change halfway through a celebration.
  const withYear = spansYears(sorted)
  const formatTick = withYear ? formatDay : formatDayShort
  const xTicks = pickDateTicks(
    visible.length ? visible : sorted,
    spark ? 0 : dateTickCount(plotWidth, withYear),
  )

  const summary =
    label ??
    (sorted.length
      ? `${sorted.length} records, from ${formatWeightValue(sorted[0].weightKg, unit)} to ${formatWeightValue(sorted.at(-1)!.weightKg, unit)} ${unit}`
      : "No records yet")

  const activeIndex = pinned ?? hovered
  const activePoint = activeIndex !== null ? (allPoints[activeIndex] ?? null) : null

  // A pinned tooltip closes on the next click anywhere outside the chart.
  useEffect(() => {
    if (pinned === null) return
    function dismiss(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setPinned(null)
    }
    document.addEventListener("pointerdown", dismiss)
    return () => document.removeEventListener("pointerdown", dismiss)
  }, [pinned, containerRef])

  /** The record nearest a pointer event, with how far away it actually is in pixels. */
  function nearestTo(event: React.PointerEvent | React.MouseEvent) {
    if (spark || !plotWidth || !settled || allPoints.length === 0) return null
    const box = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - box.left
    const y = event.clientY - box.top

    let index = 0
    let best = Infinity
    for (const [candidate, point] of allPoints.entries()) {
      // Weighted towards x, so sweeping across the plot still tracks the line — but y
      // breaks the tie between two records stacked on the same day.
      const distance = Math.abs(point.x - x) * 3 + Math.abs(point.y - y)
      if (distance < best) {
        best = distance
        index = candidate
      }
    }

    const point = allPoints[index]
    return { index, pixels: Math.hypot(point.x - x, point.y - y) }
  }

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      style={{ height }}
      onPointerLeave={() => setHovered(null)}
      onPointerMove={(event) => {
        // Touch reports a move on every tap; only a real cursor should drive hover.
        if (event.pointerType !== "mouse" || pinned !== null) return
        const found = nearestTo(event)
        if (found) setHovered(found.index)
      }}
      onClick={(event) => {
        const found = nearestTo(event)
        // Far from every record, so this is a dismiss rather than a selection.
        if (!found || found.pixels > TAP_RADIUS) {
          setPinned(null)
          return
        }
        setPinned((current) => (current === found.index ? null : found.index))
      }}
    >
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={summary}
          className="overflow-visible"
        >
          <defs>
            {/* Red through to gold along the line: the newest record is the hottest end. */}
            <linearGradient id={`${gradientId}-line`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.75" />
              <stop offset="55%" stopColor="var(--highlight)" />
              <stop offset="100%" stopColor="var(--chart-4)" />
            </linearGradient>
            <linearGradient id={`${gradientId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--highlight)" stopOpacity="0.28" />
              <stop offset="100%" stopColor="var(--highlight)" stopOpacity="0" />
            </linearGradient>
          </defs>

          {!spark && (
            <m.g initial={intro ? { opacity: 0 } : false} animate={{ opacity: 1 }}>
              {yTicks.map((tick) => {
                const y = pad.top + project(tick, yDomain, [plotHeight, 0])
                return (
                  <g key={tick}>
                    {/* Solid hairlines — a dashed grid reads as a threshold it isn't. */}
                    <line
                      x1={pad.left}
                      x2={width - pad.right}
                      y1={y}
                      y2={y}
                      stroke="var(--border)"
                      strokeWidth={1}
                    />
                    <text
                      x={pad.left - 10}
                      y={y}
                      textAnchor="end"
                      dominantBaseline="middle"
                      className="fill-muted-foreground"
                      style={{ fontSize: 11 }}
                    >
                      {tick}
                    </text>
                  </g>
                )
              })}
            </m.g>
          )}

          {!spark &&
            xTicks.map((day) => {
              const x = pad.left + project(timeOf(day), xDomain, [0, plotWidth])
              // A label near either edge hangs inward rather than spilling past the plot.
              const anchor =
                x < pad.left + 40 ? "start" : x > width - pad.right - 40 ? "end" : "middle"
              return (
                <m.text
                  key={day}
                  initial={intro ? { opacity: 0 } : false}
                  animate={{ opacity: 1 }}
                  x={x}
                  y={height - 8}
                  textAnchor={anchor}
                  className="fill-muted-foreground"
                  style={{ fontSize: 11 }}
                >
                  {formatTick(day)}
                </m.text>
              )
            })}

          {points.length > 1 && (
            <>
              {/* The fill arrives behind the line rather than racing it. */}
              <m.path
                d={`${pathFrom(points)} L${points.at(-1)!.x} ${pad.top + plotHeight} L${points[0].x} ${pad.top + plotHeight} Z`}
                fill={`url(#${gradientId}-area)`}
                initial={intro ? { opacity: 0 } : false}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: INTRO_DRAW * 0.45 }}
              />
              {/* A blurred copy under the line does the glow; a filter on the line itself
                  would soften the stroke it is meant to make brighter. */}
              <m.path
                d={pathFrom(points)}
                fill="none"
                stroke="var(--highlight)"
                strokeWidth={6}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.35}
                style={{ filter: "blur(7px)" }}
                initial={intro ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: INTRO_DRAW, ease: "easeInOut" }}
              />
              <m.path
                d={pathFrom(points)}
                fill="none"
                stroke={`url(#${gradientId}-line)`}
                strokeWidth={spark ? 2 : 2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={intro ? { pathLength: 0 } : false}
                animate={{ pathLength: 1 }}
                transition={{ duration: INTRO_DRAW, ease: "easeInOut" }}
              />
            </>
          )}

          {/* The stretch the new record adds, drawing itself into place. */}
          {phase === "draw" && newSegment.length > 1 && (
            <m.path
              d={pathFrom(newSegment)}
              fill="none"
              stroke={`url(#${gradientId}-line)`}
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={{ pathLength: 0, opacity: 1 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.47, ease: "easeOut" }}
            />
          )}

          {points.map((point, index) => {
            const isLatest = point.entry.id === latest?.entry.id
            if (celebrate && point.entry.id === celebrate.entryId) return null
            const radius = spark ? 2.5 : 4.5
            return (
              <m.circle
                key={point.entry.id}
                cx={point.x}
                cy={point.y}
                fill="var(--card)"
                stroke={isLatest ? "var(--chart-4)" : "var(--highlight)"}
                strokeWidth={2}
                // Radius, not scale: an SVG transform resolves against the viewport, which
                // would pop the dot somewhere other than its own point.
                initial={intro ? { r: 0 } : false}
                animate={{ r: radius }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 22,
                  // Each dot arrives as the line passes it.
                  delay: points.length > 1 ? (index / (points.length - 1)) * INTRO_DRAW : 0,
                }}
              />
            )
          })}

          {/* The new record: lands with an overshoot, then a shockwave ring leaves it.
              Both animate their radius rather than a transform — scaling a <g> depends on
              transform-origin resolving against the SVG viewport, which puts the dot
              somewhere other than the point it belongs to. */}
          {newPoint && settled && (
            <g ref={newDotRef}>
              <m.circle
                cx={newPoint.x}
                cy={newPoint.y}
                fill="none"
                stroke="var(--chart-4)"
                strokeWidth={2}
                initial={{ r: 6, opacity: 0.85 }}
                animate={{ r: 30, opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut", delay: 0.12 }}
              />
              <m.circle
                cx={newPoint.x}
                cy={newPoint.y}
                fill="var(--chart-4)"
                stroke="var(--background)"
                strokeWidth={2}
                initial={{ r: 0 }}
                animate={{ r: 6 }}
                transition={{ type: "spring", stiffness: 420, damping: 14 }}
              />
            </g>
          )}

          {/* One direct label, on the record that matters. Never a number on every point. */}
          {!spark && latest && settled && (
            <m.text
              x={Math.min(latest.x, width - pad.right)}
              y={latest.y - 14}
              textAnchor={latest.x > width - pad.right - 40 ? "end" : "middle"}
              className="fill-foreground font-medium"
              style={{ fontSize: 12 }}
              initial={intro ? { opacity: 0 } : false}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3, delay: INTRO_DRAW }}
            >
              {formatWeightValue(latest.entry.weightKg, unit)} {unit}
            </m.text>
          )}

          {activePoint && !spark && settled && (
            <g pointerEvents="none">
              <line
                x1={activePoint.x}
                x2={activePoint.x}
                y1={pad.top}
                y2={pad.top + plotHeight}
                stroke="var(--muted-foreground)"
                strokeWidth={1}
                opacity={0.5}
              />
              <circle
                cx={activePoint.x}
                cy={activePoint.y}
                r={6}
                fill="var(--highlight)"
                stroke="var(--background)"
                strokeWidth={2}
              />
            </g>
          )}
        </svg>
      )}

      {activePoint && !spark && settled && (
        <Tooltip
          point={activePoint}
          index={activeIndex!}
          points={allPoints}
          unit={unit}
          width={width}
        />
      )}
    </div>
  )
}

function Tooltip({
  point,
  index,
  points,
  unit,
  width,
}: {
  point: Point
  index: number
  points: Point[]
  unit: WeightUnit
  width: number
}) {
  const previous = index > 0 ? points[index - 1] : null
  const gain = previous ? point.entry.weightKg - previous.entry.weightKg : null
  const flipped = point.x > width - 130

  return (
    <div
      className="pointer-events-none absolute z-10 min-w-32 rounded-lg bg-popover px-3 py-2 text-xs shadow-[0_8px_24px_rgb(0_0_0/0.45)] ring-1 ring-foreground/10"
      style={{
        left: flipped ? undefined : point.x + 12,
        right: flipped ? width - point.x + 12 : undefined,
        top: Math.max(4, point.y - 46),
      }}
    >
      <p className="font-medium text-foreground">
        {formatWeightValue(point.entry.weightKg, unit)} {unit}
      </p>
      <p className="text-muted-foreground">{formatDay(point.entry.achievedOn)}</p>
      {gain !== null && gain > 0 && (
        <p className="mt-0.5 text-chart-4">{formatDelta(gain, unit)} on the one before</p>
      )}
      {point.entry.byCoach && <p className="mt-0.5 text-muted-foreground">Logged by coach</p>}
    </div>
  )
}
