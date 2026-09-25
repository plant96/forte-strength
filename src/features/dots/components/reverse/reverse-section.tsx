"use client"

import { cn } from "cn"
import { CheckIcon, InfoIcon, TargetIcon, TrendingUpIcon } from "lucide-react"
import { m, type Variants } from "motion/react"

import { SELECT_TRIGGER_CLASS } from "@/components/forms/section-legend"
import { UnitInput } from "@/components/forms/unit-input"
import { AnimatedNumber } from "@/components/motion/animated-number"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FieldError } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { formatNumber } from "@/lib/breakdown/format"
import { kgToLb, type WeightUnit } from "@/lib/units"

import { SCORE_KINDS, SCORE_PRESETS, type ScoreKind } from "../../lib/constants"
import type { DotsResult } from "../../lib/dots"
import type { ReverseResult } from "../../lib/reverse"
import { parseNumberInput, type DesiredScore, type DotsFormValues } from "../../schema"

export interface ReverseTarget {
  kind: ScoreKind
  /** As typed, so partially entered numbers survive re-renders. */
  score: string
}

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring", stiffness: 220, damping: 26 },
  },
}

interface ReverseSectionProps {
  values: DotsFormValues
  result: DotsResult
  target: ReverseTarget
  onTargetChange: (target: ReverseTarget) => void
  desired: DesiredScore | null
  reverse: ReverseResult | null
}

/**
 * Works backwards from a score to the total it takes at the lifter's bodyweight.
 *
 * With one answer, the controls sit beside it. With two (an age-adjusted total as well),
 * the controls move across the top and the two tiles share the row beneath, so the card
 * never has a short column next to a tall one.
 */
export function ReverseSection({
  values,
  result,
  target,
  onTargetChange,
  desired,
  reverse,
}: ReverseSectionProps) {
  const kindLabel = SCORE_KINDS.find((kind) => kind.id === target.kind)?.label ?? "DOTS"
  const error = desired?.error ?? null
  const coefficient = result.age.coefficient
  const currentScore = target.kind === "dots" ? result.dots.score : result.glp.score
  // At a coefficient of exactly 1 the age-adjusted total is the same number, so it's noise.
  const showAgeTile = target.kind === "dots" && coefficient !== 1

  const sentence = (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-2 text-base">
      <label htmlFor="desired-score" className="font-medium">
        Type your desired
      </label>
      <Select
        value={target.kind}
        onValueChange={(next) => onTargetChange({ ...target, kind: next as ScoreKind })}
      >
        <SelectTrigger
          aria-label="Score type"
          className={cn("w-28 font-semibold", SELECT_TRIGGER_CLASS)}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent position="popper">
          {SCORE_KINDS.map((kind) => (
            <SelectItem key={kind.id} value={kind.id}>
              {kind.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span className="font-medium">score</span>
    </div>
  )

  const scoreInput = (groupClassName?: string) => (
    <UnitInput
      id="desired-score"
      aria-label="Desired score"
      inputMode="decimal"
      placeholder={target.kind === "dots" ? "500" : "100"}
      suffix="points"
      value={target.score}
      onChange={(event) => onTargetChange({ ...target, score: event.target.value })}
      aria-invalid={error !== null}
      groupClassName={groupClassName}
    />
  )

  const errorLine = <FieldError errors={error ? [{ message: error }] : []} />

  const hint = (
    <p className="text-xs text-muted-foreground">
      From the stats above, you&apos;re at{" "}
      <span className="font-medium text-foreground/90 tabular-nums">
        {formatNumber(currentScore, 2)} {kindLabel}
      </span>{" "}
      now.
    </p>
  )

  const quickPicks = <QuickPicks target={target} onTargetChange={onTargetChange} />

  const requiredTile = (
    <ResultTile
      label="Required total"
      caption={reverse ? `for ${formatNumber(reverse.input.score, 2)} ${kindLabel}` : null}
      totalKg={reverse?.totalKg ?? null}
      currentKg={result.input.totalKg}
      unit={values.totalUnit}
      highlight
    />
  )

  const glpNote = target.kind === "glp" && (
    <p className="flex items-center gap-2.5 rounded-xl bg-muted/25 px-4 py-3 text-xs leading-relaxed text-muted-foreground ring-1 ring-foreground/10">
      <InfoIcon className="size-4 shrink-0 text-highlight" aria-hidden="true" />
      <span>
        <span className="font-medium text-foreground/90">GLP has no age adjustment,</span> so this
        total is the same at any age.
      </span>
    </p>
  )

  return (
    <m.section
      aria-labelledby="reverse-heading"
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={sectionVariants}
      className="flex flex-col gap-5"
    >
      <div className="flex flex-col gap-1.5">
        <h2
          id="reverse-heading"
          className="font-heading text-sm font-semibold tracking-[0.2em] uppercase"
        >
          <span className="text-primary">04</span> Required total
        </h2>
        <p className="max-w-xl text-sm text-muted-foreground">
          Work backwards: pick a score and see the total it takes at your bodyweight.
        </p>
      </div>

      <Card className="gap-0 py-0">
        {showAgeTile ? (
          <>
            <div className="flex flex-col gap-4 p-5 sm:p-6">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                {sentence}
                {scoreInput("md:w-56")}
              </div>
              {errorLine}
              <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                {quickPicks}
                {hint}
              </div>
            </div>
            <div className="grid gap-3 border-t border-border p-5 sm:grid-cols-2 sm:p-6">
              {requiredTile}
              <ResultTile
                label="Including your age coefficient"
                caption={`÷ ${formatNumber(coefficient, 3)} at age ${result.age.usedAge}`}
                totalKg={reverse?.ageAdjusted?.totalKg ?? null}
                currentKg={result.input.totalKg}
                unit={values.totalUnit}
              />
            </div>
          </>
        ) : (
          <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)] lg:items-center lg:gap-10">
            <div className="flex flex-col gap-3">
              {sentence}
              {scoreInput()}
              {errorLine}
              {hint}
              <div className="pt-1">{quickPicks}</div>
            </div>
            <div className="flex flex-col gap-3">
              {requiredTile}
              {glpNote}
            </div>
          </div>
        )}
      </Card>
    </m.section>
  )
}

function QuickPicks({
  target,
  onTargetChange,
}: Pick<ReverseSectionProps, "target" | "onTargetChange">) {
  const typedScore = parseNumberInput(target.score)

  return (
    <div role="group" aria-label="Quick picks" className="flex flex-wrap items-center gap-1.5">
      <span className="mr-1 text-xs text-muted-foreground">Quick picks</span>
      {SCORE_PRESETS[target.kind].map((preset) => {
        const active = typedScore === preset
        return (
          <Button
            key={preset}
            type="button"
            size="sm"
            variant="outline"
            aria-pressed={active}
            onClick={() => onTargetChange({ ...target, score: String(preset) })}
            className={cn(
              "rounded-full tabular-nums",
              // The outline variant styles its dark state explicitly, so match that.
              active &&
                "border-primary/60 bg-primary/15 text-foreground dark:border-primary/60 dark:bg-primary/15 dark:hover:bg-primary/25",
            )}
          >
            {preset}
          </Button>
        )
      })}
    </div>
  )
}

interface ResultTileProps {
  label: string
  caption: string | null
  totalKg: number | null
  /** The lifter's current total, for the "how far away" line. */
  currentKg: number
  unit: WeightUnit
  highlight?: boolean
}

function ResultTile({
  label,
  caption,
  totalKg,
  currentKg,
  unit,
  highlight = false,
}: ResultTileProps) {
  const other: WeightUnit = unit === "kg" ? "lb" : "kg"
  const inUnit = (kg: number, which: WeightUnit) => (which === "kg" ? kg : kgToLb(kg))
  const decimals = (which: WeightUnit) => (which === "kg" ? 1 : 0)
  const display = totalKg === null ? null : inUnit(totalKg, unit)
  const otherDisplay = totalKg === null ? null : inUnit(totalKg, other)
  const deltaKg = totalKg === null ? null : totalKg - currentKg

  return (
    <div
      className={cn(
        "flex flex-col gap-1 rounded-xl bg-card p-4 ring-1",
        highlight ? "ring-primary/35" : "ring-foreground/10",
      )}
    >
      <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.15em] text-muted-foreground uppercase">
        {highlight && <TargetIcon className="size-3.5 text-highlight" aria-hidden="true" />}
        {label}
      </span>
      <span className="flex flex-wrap items-baseline gap-x-2">
        <span className="font-heading text-3xl leading-none font-bold sm:text-4xl">
          {display === null ? (
            <span className="text-muted-foreground/60">—</span>
          ) : (
            <AnimatedNumber value={display} decimals={decimals(unit)} />
          )}
        </span>
        <span className="text-sm text-muted-foreground">{unit}</span>
        {otherDisplay !== null && (
          <span className="text-xs text-muted-foreground tabular-nums">
            ({formatNumber(otherDisplay, decimals(other))} {other})
          </span>
        )}
      </span>
      <span className="text-xs text-muted-foreground tabular-nums">
        {display === null ? "Enter a score to see the total." : caption}
      </span>
      {deltaKg !== null && <DeltaLine deltaKg={deltaKg} unit={unit} decimals={decimals(unit)} />}
    </div>
  )
}

/** How the required total compares with what the lifter already totals. */
function DeltaLine({
  deltaKg,
  unit,
  decimals,
}: {
  deltaKg: number
  unit: WeightUnit
  decimals: number
}) {
  const amount = `${formatNumber(Math.abs(unit === "kg" ? deltaKg : kgToLb(deltaKg)), decimals)} ${unit}`
  // Within a tenth of a kilo is the same total once rounded for display.
  if (Math.abs(deltaKg) < 0.05) {
    return (
      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <CheckIcon className="size-3.5 text-highlight" aria-hidden="true" />
        That&apos;s your current total.
      </span>
    )
  }
  if (deltaKg > 0) {
    return (
      <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
        <TrendingUpIcon className="size-3.5 text-highlight" aria-hidden="true" />
        {amount} more than your current total
      </span>
    )
  }
  return (
    <span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground tabular-nums">
      <CheckIcon className="size-3.5 text-bulk" aria-hidden="true" />
      Your current total already clears it by {amount}
    </span>
  )
}
