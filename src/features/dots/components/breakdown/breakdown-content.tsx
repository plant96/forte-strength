"use client"

import { CopyBreakdownButton } from "@/components/breakdown/copy-button"
import { InputsTable } from "@/components/breakdown/inputs-table"
import { BREAKDOWN_TOOLBAR_ID, JumpNav, type JumpNavItem } from "@/components/breakdown/jump-nav"
import { SectionBlock } from "@/components/breakdown/section-block"
import { VariableGlossary } from "@/components/breakdown/variable-glossary"
import { formatNumber } from "@/lib/breakdown/format"

import type { DotsResult } from "../../lib/dots"
import {
  buildDotsBreakdown,
  DOTS_SOURCES,
  dotsBreakdownToText,
  type DotsBreakdown,
} from "../../lib/formulas"
import { DOTS_GLOSSARY, DOTS_GLOSSARY_ORDER } from "../../lib/glossary"
import type { ReverseResult } from "../../lib/reverse"
import type { DotsFormValues } from "../../schema"
import { DotsFormulaStepCard } from "./formula-step"

const SECTION_LABELS: Record<DotsBreakdown["sections"][number]["id"], string> = {
  dots: "DOTS",
  age: "Age",
  glp: "GLP",
  reverse: "Required total",
}

interface BreakdownContentProps {
  values: DotsFormValues
  result: DotsResult
  reverse: ReverseResult | null
}

export function BreakdownContent({ values, result, reverse }: BreakdownContentProps) {
  const breakdown = buildDotsBreakdown(values, result, reverse)
  const navItems: JumpNavItem[] = [
    { id: "inputs", label: "Inputs" },
    ...breakdown.sections.map((section) => ({ id: section.id, label: SECTION_LABELS[section.id] })),
    { id: "variables", label: "Variables" },
    { id: "sources", label: "Sources" },
  ]

  return (
    <div className="flex flex-col">
      <div
        id={BREAKDOWN_TOOLBAR_ID}
        className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-popover/95 px-5 py-3 backdrop-blur-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SummaryEquation totals={breakdown.totals} />
          <CopyBreakdownButton getText={() => dotsBreakdownToText(breakdown)} />
        </div>
        <JumpNav items={navItems} />
      </div>

      <div className="flex flex-col gap-12 px-5 pt-6 pb-10">
        <SectionBlock
          id="inputs"
          title="Your inputs"
          description="What you entered, and the metric values the formulas use."
        >
          <InputsTable rows={breakdown.inputs} glossary={DOTS_GLOSSARY} />
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
                <DotsFormulaStepCard key={step.id} step={step} breakdown={breakdown} />
              ))}
            </div>
          </SectionBlock>
        ))}

        <SectionBlock
          id="variables"
          title="Variables"
          description="Every symbol used in the calculation, with its unit and range."
        >
          <VariableGlossary glossary={DOTS_GLOSSARY} order={DOTS_GLOSSARY_ORDER} />
        </SectionBlock>

        <SectionBlock id="sources" title="Sources & notes">
          <ol className="flex list-decimal flex-col gap-3 pl-5 text-sm marker:text-muted-foreground">
            {DOTS_SOURCES.map((source) => (
              <li key={source.label}>
                <span className="font-medium">{source.label}:</span>{" "}
                <span className="text-muted-foreground">{source.citation}</span>
              </li>
            ))}
          </ol>
          <p className="rounded-lg bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            Values are rounded for display, but every step runs at full precision. Re-doing the math
            by hand with the rounded numbers can differ in the last digit.
          </p>
        </SectionBlock>
      </div>
    </div>
  )
}

function SummaryEquation({ totals }: { totals: DotsBreakdown["totals"] }) {
  return (
    <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-sm tabular-nums">
      <span className="text-muted-foreground">T</span>
      <span className="font-semibold">{formatNumber(totals.totalKg, 1)}</span>
      <span className="text-muted-foreground">× 500 ÷</span>
      <span className="text-muted-foreground">P</span>
      <span className="font-semibold">{formatNumber(totals.reference, 1)}</span>
      <span className="text-muted-foreground">=</span>
      <span className="rounded-md bg-primary/15 px-2 py-0.5 font-semibold ring-1 ring-primary/30">
        DOTS {formatNumber(totals.dots, 2)}
      </span>
    </p>
  )
}
