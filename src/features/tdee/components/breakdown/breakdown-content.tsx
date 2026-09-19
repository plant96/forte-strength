"use client"

import { CheckIcon, CopyIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Tex } from "@/components/math/tex"
import { Button } from "@/components/ui/button"
import type { WeightUnit } from "@/lib/units"

import {
  breakdownToText,
  buildBreakdown,
  formatNumber,
  SOURCES,
  type Breakdown,
  type BreakdownInputRow,
} from "../../lib/formulas"
import { GLOSSARY } from "../../lib/glossary"
import type { CalorieTarget } from "../../lib/macros"
import { TEF_NOTE } from "../../lib/tef"
import type { TdeeResult } from "../../lib/tdee"
import type { TdeeFormValues } from "../../schema"
import { FormulaStepCard } from "./formula-step"
import { VariableGlossary } from "./variable-glossary"

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
        id="breakdown-toolbar"
        className="sticky top-0 z-10 flex flex-col gap-3 border-b border-border bg-popover/95 px-5 py-3 backdrop-blur-md"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <SummaryEquation totals={breakdown.totals} />
          <CopyBreakdownButton breakdown={breakdown} />
        </div>
        <nav aria-label="Jump to a step" className="-mx-5 overflow-x-auto px-5">
          <ul className="flex w-max gap-1.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      <div className="flex flex-col gap-12 px-5 pt-6 pb-10">
        <SectionBlock
          id="inputs"
          title="Your inputs"
          description="What you entered, and the metric values the formulas use."
        >
          <InputsTable rows={breakdown.inputs} />
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
          <VariableGlossary />
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

/** Scrolls the panel so a section starts just below the sticky toolbar (whose height varies). */
function scrollToSection(id: string) {
  const section = document.getElementById(`breakdown-${id}`)
  const scroller = document.getElementById("breakdown-scroll")
  if (!section || !scroller) return

  const toolbarHeight = document.getElementById("breakdown-toolbar")?.offsetHeight ?? 0
  const top =
    section.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    toolbarHeight -
    16
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  scroller.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" })
}

interface SectionBlockProps {
  id: string
  step?: number
  title: string
  description?: string
  children: React.ReactNode
}

function SectionBlock({ id, step, title, description, children }: SectionBlockProps) {
  return (
    <section
      id={`breakdown-${id}`}
      aria-labelledby={`breakdown-${id}-title`}
      className="flex flex-col gap-4"
    >
      <div className="flex flex-col gap-1">
        {step !== undefined && (
          <p className="font-heading text-xs font-semibold tracking-[0.25em] text-primary uppercase">
            Step {step}
          </p>
        )}
        <h3 id={`breakdown-${id}-title`} className="font-heading text-2xl font-bold uppercase">
          {title}
        </h3>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </section>
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

type CopyStatus = "idle" | "copied" | "failed"

function CopyBreakdownButton({ breakdown }: { breakdown: Breakdown }) {
  const [status, setStatus] = useState<CopyStatus>("idle")

  useEffect(() => {
    if (status === "idle") return
    const timeout = window.setTimeout(() => setStatus("idle"), 2000)
    return () => window.clearTimeout(timeout)
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(breakdownToText(breakdown))
      setStatus("copied")
    } catch {
      setStatus("failed")
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} aria-live="polite">
      {status === "copied" ? <CheckIcon /> : status === "failed" ? <XIcon /> : <CopyIcon />}
      {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy breakdown"}
    </Button>
  )
}

function InputsTable({ rows }: { rows: BreakdownInputRow[] }) {
  return (
    <div className="overflow-x-auto rounded-xl ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-left text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Input
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              You entered
            </th>
            <th scope="col" className="px-4 py-2.5 font-medium">
              Used in formulas
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row" className="px-4 py-2.5 text-left font-medium">
                {row.label}
              </th>
              <td className="px-4 py-2.5 text-muted-foreground tabular-nums">{row.entered}</td>
              <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                {row.symbol && (
                  <span className="mr-1 text-muted-foreground">
                    <Tex math={GLOSSARY[row.symbol].tex} /> =
                  </span>
                )}
                <span className="font-semibold text-highlight">{row.used}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
