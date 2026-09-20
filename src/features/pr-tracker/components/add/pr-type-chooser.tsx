"use client"

import { cn } from "cn"
import { MinusIcon, PlusIcon, TrophyIcon } from "lucide-react"
import { m } from "motion/react"
import { useState } from "react"

import type { WeightUnit } from "@/lib/units"

import { currentRecord } from "../../lib/records"
import {
  KIND_BLURBS,
  KIND_LABELS,
  SERIES_LIMITS,
  normaliseShape,
  shapeChipLabel,
  type PrKind,
  type SeriesShape,
} from "../../lib/series"
import { formatWeight } from "../../lib/weight"
import type { SeriesView } from "../../queries"

/**
 * Picking which PR type the record belongs to.
 *
 * The PR types the lifter already has are shown as chips inside each card, so adding to an
 * existing history is one tap and visibly *adding to* it — the alternative, typing "2" into
 * a reps box and hoping it matches, is how people end up with two graphs for the same
 * thing. Creating a new type is a deliberate second step.
 */

interface PrTypeChooserProps {
  series: SeriesView[]
  unit: WeightUnit
  value: SeriesShape | null
  onChange: (shape: SeriesShape) => void
}

const KIND_ORDER: PrKind[] = ["one-rep-max", "rep", "volume"]

function sameShape(a: SeriesShape, b: SeriesShape) {
  const left = normaliseShape(a)
  const right = normaliseShape(b)
  return left.kind === right.kind && left.sets === right.sets && left.reps === right.reps
}

export function PrTypeChooser({ series, unit, value, onChange }: PrTypeChooserProps) {
  const [draft, setDraft] = useState({ reps: 3, sets: 3 })
  const [building, setBuilding] = useState<PrKind | null>(null)

  return (
    <div className="grid gap-3 @lg:grid-cols-3">
      {KIND_ORDER.map((kind) => {
        const existing = series.filter((item) => item.kind === kind)
        const selected = value?.kind === kind
        const isOneRepMax = kind === "one-rep-max"

        return (
          <div
            key={kind}
            className={cn(
              "flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 transition-colors",
              selected ? "ring-primary/50" : "ring-foreground/10",
            )}
          >
            <button
              type="button"
              onClick={() => {
                if (isOneRepMax) {
                  onChange({ kind, sets: 1, reps: 1 })
                  setBuilding(null)
                } else {
                  setBuilding((current) => (current === kind ? null : kind))
                }
              }}
              className="flex flex-col gap-1 text-left"
            >
              <span className="flex items-center gap-2">
                <span
                  className={cn(
                    "grid size-7 place-items-center rounded-md transition-colors",
                    selected ? "bg-primary/20 text-highlight" : "bg-muted text-muted-foreground",
                  )}
                >
                  <TrophyIcon className="size-3.5" />
                </span>
                <span className="font-heading text-sm font-semibold tracking-wide uppercase">
                  {KIND_LABELS[kind]}
                </span>
              </span>
              <span className="text-xs leading-snug text-muted-foreground">
                {KIND_BLURBS[kind]}
              </span>
            </button>

            {existing.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {existing.map((item) => {
                  const record = currentRecord(item.entries)
                  const active = value ? sameShape(value, item) : false
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChange({ kind: item.kind, sets: item.sets, reps: item.reps })
                        setBuilding(null)
                      }}
                      title={record ? `Record ${formatWeight(record.weightKg, unit)}` : undefined}
                      className={cn(
                        "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
                        active
                          ? "bg-primary/20 text-foreground ring-primary/50"
                          : "bg-muted/60 text-muted-foreground ring-foreground/10 hover:text-foreground",
                      )}
                    >
                      {shapeChipLabel(item)}
                      {record && (
                        <span className="ml-1.5 text-muted-foreground">
                          {formatWeight(record.weightKg, unit)}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            )}

            {!isOneRepMax && (
              <>
                {building !== kind ? (
                  <button
                    type="button"
                    onClick={() => setBuilding(kind)}
                    className="self-start text-xs font-medium text-highlight hover:underline"
                  >
                    {kind === "volume"
                      ? existing.length > 0
                        ? "Different sets and reps"
                        : "Choose sets and reps"
                      : existing.length > 0
                        ? "Different reps"
                        : "Choose reps"}
                  </button>
                ) : (
                  <m.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="flex flex-col gap-2 overflow-hidden"
                  >
                    {kind === "volume" && (
                      <Stepper
                        label="Sets"
                        value={draft.sets}
                        min={SERIES_LIMITS.volume.sets.min}
                        max={SERIES_LIMITS.volume.sets.max}
                        onChange={(sets) => setDraft((current) => ({ ...current, sets }))}
                      />
                    )}
                    <Stepper
                      label="Reps"
                      value={draft.reps}
                      min={
                        kind === "rep" ? SERIES_LIMITS.rep.reps.min : SERIES_LIMITS.volume.reps.min
                      }
                      max={
                        kind === "rep" ? SERIES_LIMITS.rep.reps.max : SERIES_LIMITS.volume.reps.max
                      }
                      onChange={(reps) => setDraft((current) => ({ ...current, reps }))}
                    />
                    <UseThisButton
                      kind={kind}
                      draft={draft}
                      existing={existing}
                      onChange={(shape) => {
                        onChange(shape)
                        setBuilding(null)
                      }}
                    />
                  </m.div>
                )}
              </>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * Confirms a hand-picked rep scheme — and says so plainly when that scheme already exists,
 * so the lifter knows they are continuing a history rather than starting one.
 *
 * The wording is "choose", never "start": records are logged after the session, so nothing
 * is being begun here. The lifter is telling us which set the weight belonged to.
 */
function UseThisButton({
  kind,
  draft,
  existing,
  onChange,
}: {
  kind: PrKind
  draft: { sets: number; reps: number }
  existing: SeriesView[]
  onChange: (shape: SeriesShape) => void
}) {
  const shape: SeriesShape = normaliseShape({
    kind,
    sets: kind === "volume" ? draft.sets : 1,
    reps: draft.reps,
  })
  const duplicate = existing.find((item) => sameShape(item, shape))

  return (
    <button
      type="button"
      onClick={() => onChange(shape)}
      className="rounded-lg bg-primary/15 px-3 py-2 text-xs font-medium text-foreground ring-1 ring-primary/30 transition-colors hover:bg-primary/25"
    >
      {duplicate
        ? `Choose ${shapeChipLabel(shape)} · already tracked`
        : `Choose ${shapeChipLabel(shape)}`}
    </button>
  )
}

function Stepper({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1">
        <StepButton
          label={`One fewer ${label.toLowerCase()}`}
          disabled={value <= min}
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <MinusIcon className="size-3.5" />
        </StepButton>
        <span className="w-7 text-center font-mono text-sm tabular-nums">{value}</span>
        <StepButton
          label={`One more ${label.toLowerCase()}`}
          disabled={value >= max}
          onClick={() => onChange(Math.min(max, value + 1))}
        >
          <PlusIcon className="size-3.5" />
        </StepButton>
      </span>
    </div>
  )
}

function StepButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="grid size-7 place-items-center rounded-md bg-muted/60 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
    >
      {children}
    </button>
  )
}
