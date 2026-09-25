"use client"

import { m } from "motion/react"

import { fadeUpVariants, popInGroupVariants, scaleInVariants } from "@/components/motion/variants"
import { formatNumber } from "@/lib/breakdown/format"

import type { DotsResult } from "../../lib/dots"
import type { ReverseResult } from "../../lib/reverse"
import type { DotsFormValues } from "../../schema"
import { BreakdownSheet } from "../breakdown/breakdown-sheet"
import { BodyweightNote } from "./bodyweight-note"
import { DotsSummary } from "./dots-summary"
import { ScoreTiles } from "./score-tiles"

interface ScoresPanelProps {
  values: DotsFormValues
  result: DotsResult
  /** The reverse calculator's current answer, shown in the calculation panel. */
  reverse: ReverseResult | null
}

const trailingVariants = fadeUpVariants()

export function ScoresPanel({ values, result, reverse }: ScoresPanelProps) {
  const { input } = result
  const sex = input.sex === "male" ? "Male" : "Female"

  return (
    <section aria-labelledby="results-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="results-heading"
          className="font-heading text-sm font-semibold tracking-[0.2em] uppercase"
        >
          <span className="text-primary">03</span> Your scores
        </h2>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(input.bodyweightKg, 1)} kg · {input.ageYears} y · {sex}
        </p>
      </div>

      <m.div initial="hidden" animate="visible" className="flex flex-col gap-4">
        <m.div variants={scaleInVariants} className="relative z-10">
          <DotsSummary result={result} />
        </m.div>
        <m.div variants={popInGroupVariants} className="relative z-0">
          <ScoreTiles result={result} />
        </m.div>
        <m.div variants={trailingVariants} className="flex flex-col gap-3">
          <BreakdownSheet values={values} result={result} reverse={reverse} />
          {result.bodyweight.clamped && <BodyweightNote result={result} />}
        </m.div>
      </m.div>
    </section>
  )
}
