"use client"

import { CopyBreakdownButton } from "@/components/breakdown/copy-button"
import { InputsTable } from "@/components/breakdown/inputs-table"
import { BREAKDOWN_TOOLBAR_ID, JumpNav } from "@/components/breakdown/jump-nav"
import { SectionBlock } from "@/components/breakdown/section-block"
import { VariableGlossary } from "@/components/breakdown/variable-glossary"
import type { WeightUnit } from "@/lib/units"

import {
  breakdownToText,
  buildBreakdown,
  formatNumber,
  SOURCES,
  type Breakdown,
} from "../../lib/formulas"
import { GLOSSARY, GLOSSARY_ORDER } from "../../lib/glossary"
import type { CalorieTarget } from "../../lib/macros"
import { TEF_NOTE } from "../../lib/tef"
import type { TdeeResult } from "../../lib/tdee"
import type { TdeeFormValues } from "../../schema"
import { FormulaStepCard } from "./formula-step"

const NAV_ITEMS = [
  { id: "inputs", label: "Inputs" },
  { id: "bmr", label: "BMR" },
  { id: "activity", label: "Activity" },
  { id: "tdee", label: "TDEE" },
  { id: "targets", label: "Targets" },
  { id: "macros", label: "Macros" },
  { id: "variables", label: "Variables" },
  { id: "sources", label: "Sources" },
] as const

interface BreakdownContentProps {
  values: TdeeFormValues
  result: TdeeResult
  goalUnit: WeightUnit
  calorieTarget: CalorieTarget
}

export function BreakdownContent({
  values,
  result,
  goalUnit,
  calorieTarget,
}: BreakdownContentProps) {
  const breakdown = buildBreakdown(values, result, goalUnit, calorieTarget)

  return (
    <div className="flex flex-col">
      <div
        id={BREAKDOWN_TOOLBAR_ID}
        className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-popover/95 px-5 py-3 backdrop-blur-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SummaryEquation totals={breakdown.totals} />
          <CopyBreakdownButton getText={() => breakdownToText(breakdown)} />
        </div>
        <JumpNav items={NAV_ITEMS} />
      </div>

      <div className="flex flex-col gap-12 px-5 pt-6 pb-10">
        <SectionBlock
          id="inputs"
          title="Your inputs"
          description="What you entered, and the metric values the formulas use."
        >
          <InputsTable rows={breakdown.inputs} glossary={GLOSSARY} />
        </SectionBlock>

        {breakdown.sections.map((section, index) => (
          <SectionBlock
            key={section.id}
            id={section.id}
            step={index + 1}
            title={section.title}
            description={section.description}
          >
            <div className="flex flex-col gap-4">
              {section.steps.map((step) => (
                <FormulaStepCard key={step.id} step={step} breakdown={breakdown} />
              ))}
            </div>
          </SectionBlock>
        ))}

        <SectionBlock
          id="variables"
          title="Variables"
          description="Every symbol used in the calculation, with its unit and range."
        >
          <VariableGlossary glossary={GLOSSARY} order={GLOSSARY_ORDER} />
        </SectionBlock>

        <SectionBlock id="sources" title="Sources & notes">
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm marker:text-muted-foreground">
            {SOURCES.map((source) => (
              <li key={source.label}>
                <span className="font-medium">{source.label}:</span>{" "}
                <span className="text-muted-foreground">{source.citation}</span>
              </li>
            ))}
          </ol>
          <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            {TEF_NOTE}
          </p>
          <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            Values are rounded for display, but every step runs at full precision. Re-doing the math
            by hand with the rounded numbers can differ in the last digit.
          </p>
        </SectionBlock>
      </div>
    </div>
  )
}

function SummaryEquation({ totals }: { totals: Breakdown["totals"] }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm tabular-nums">
      <span className="text-muted-foreground">BMR</span>
      <span className="font-semibold">{formatNumber(totals.bmr, 0)}</span>
      <span className="text-muted-foreground">×</span>
      <span className="text-muted-foreground">M</span>
      <span className="font-semibold">{formatNumber(totals.multiplier, 3)}</span>
      <span className="text-muted-foreground">=</span>
      <span className="rounded-md bg-primary/15 px-2 py-0.5 font-semibold ring-1 ring-primary/30">
        TDEE {formatNumber(totals.tdee, 0)} kcal/day
      </span>
    </p>
  )
}
