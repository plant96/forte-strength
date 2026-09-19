"use client"

import { m } from "motion/react"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { WeightUnit } from "@/lib/units"

import type { GoalTargets } from "../../lib/goals"
import type { CalorieTarget } from "../../lib/macros"
import type { TdeeResult } from "../../lib/tdee"
import type { TdeeFormValues } from "../../schema"
import { BreakdownSheet } from "../breakdown/breakdown-sheet"
import { fadeInLateVariants, goalPanelVariants, summaryVariants } from "./animations"
import { GoalPanel } from "./goal-panel"
import { TdeeSummary } from "./tdee-summary"
import { TefNote } from "./tef-note"

interface ResultsPanelProps {
  values: TdeeFormValues
  result: TdeeResult
  goals: GoalTargets
  goalUnit: WeightUnit
  /** Calorie target the macros are built from, shown in the calculation panel. */
  calorieTarget: CalorieTarget
  onGoalUnitChange: (unit: WeightUnit) => void
}

const bulkVariants = goalPanelVariants("up")
const cutVariants = goalPanelVariants("down")

export function ResultsPanel({
  values,
  result,
  goals,
  goalUnit,
  calorieTarget,
  onGoalUnitChange,
}: ResultsPanelProps) {
  return (
    <section aria-labelledby="results-heading" className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <h2
          id="results-heading"
          className="font-heading text-sm font-semibold tracking-[0.2em] uppercase"
        >
          <span className="text-primary">03</span> Your results
        </h2>
        <ToggleGroup
          type="single"
          variant="outline"
          size="sm"
          spacing={0}
          value={goalUnit}
          onValueChange={(next) => {
            if (next) onGoalUnitChange(next as WeightUnit)
          }}
          aria-label="Unit for weekly rates"
        >
          <ToggleGroupItem value="lb" className="px-3 data-[state=on]:bg-primary/15">
            lb
          </ToggleGroupItem>
          <ToggleGroupItem value="kg" className="px-3 data-[state=on]:bg-primary/15">
            kg
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <m.div initial="hidden" animate="visible" className="flex flex-col gap-4">
        <m.div variants={bulkVariants} className="relative z-0">
          <GoalPanel direction="bulk" targets={goals.bulk} />
        </m.div>
        <m.div variants={summaryVariants} className="relative z-10">
          <TdeeSummary result={result} />
        </m.div>
        <m.div variants={cutVariants} className="relative z-0">
          <GoalPanel direction="cut" targets={goals.cut} />
        </m.div>
        <m.div variants={fadeInLateVariants} className="flex flex-col gap-3">
          <BreakdownSheet
            values={values}
            result={result}
            goalUnit={goalUnit}
            calorieTarget={calorieTarget}
          />
          <TefNote />
        </m.div>
      </m.div>
    </section>
  )
}
