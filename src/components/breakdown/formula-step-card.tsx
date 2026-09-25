import { InfoIcon } from "lucide-react"

import { Tex } from "@/components/math/tex"
import { formatNumber } from "@/lib/breakdown/format"
import type { FormulaStep, GlossaryEntry, StepResult } from "@/lib/breakdown/types"

import { Gauge } from "./gauge"

interface FormulaStepCardProps<S extends string> {
  step: FormulaStep<S, string>
  /** The calculator's symbols, for the result label and the "where" line. */
  glossary: Record<S, GlossaryEntry>
  /** Anything the calculator wants under the formula rows, e.g. a reference table. */
  extra?: React.ReactNode
}

/** One step of a calculation: the formula, the same formula with your numbers, and the result. */
export function FormulaStepCard<S extends string>({
  step,
  glossary,
  extra,
}: FormulaStepCardProps<S>) {
  const titleId = `step-${step.id}-title`

  return (
    <article
      aria-labelledby={titleId}
      className="overflow-hidden rounded-xl bg-card ring-1 ring-foreground/10"
    >
      <header className="flex flex-col gap-0.5 px-4 pt-4">
        <h4 id={titleId} className="font-heading text-base font-bold tracking-wide uppercase">
          {step.title}
        </h4>
        <p className="text-sm text-muted-foreground">{step.description}</p>
      </header>

      <dl className="flex flex-col gap-3 p-4">
        <FormulaRow label="Formula">
          <Tex block math={step.formula.tex} />
        </FormulaRow>
        <FormulaRow label="Your numbers">
          <Tex block math={step.substituted.tex} />
        </FormulaRow>
        {step.result && (
          <FormulaRow label="Result">
            <ResultValue result={step.result} glossary={glossary} />
          </FormulaRow>
        )}
      </dl>

      {step.gauge && <Gauge gauge={step.gauge} label={step.title} />}
      {extra}

      {step.notes.length > 0 && (
        <ul className="flex flex-col gap-2 px-4 pb-4">
          {step.notes.map((note) => (
            <li
              key={note}
              className="flex items-start gap-2 rounded-lg bg-primary/10 px-3 py-2 text-xs ring-1 ring-primary/20"
            >
              <InfoIcon className="mt-px size-3.5 shrink-0 text-highlight" />
              {note}
            </li>
          ))}
        </ul>
      )}

      <WhereLine symbols={step.symbols} glossary={glossary} />
    </article>
  )
}

function FormulaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1 sm:grid-cols-[7rem_minmax(0,1fr)] sm:items-center sm:gap-4">
      <dt className="text-[0.7rem] font-semibold tracking-[0.15em] text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="min-w-0">{children}</dd>
    </div>
  )
}

function ResultValue<S extends string>({
  result,
  glossary,
}: {
  result: StepResult<S>
  glossary: Record<S, GlossaryEntry>
}) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {result.symbol && (
        <span className="text-muted-foreground">
          <Tex math={`${glossary[result.symbol].tex} =`} />
        </span>
      )}
      <span className="font-heading text-2xl font-bold tabular-nums">
        {formatNumber(result.value, result.decimals)}
      </span>
      {result.unit && <span className="text-sm text-muted-foreground">{result.unit}</span>}
    </p>
  )
}

/** "Body weight" → "body weight", but acronyms like "DOTS score" keep their capitals. */
function inSentence(name: string) {
  return /^[A-Z][a-z]/.test(name) ? name.charAt(0).toLowerCase() + name.slice(1) : name
}

function WhereLine<S extends string>({
  symbols,
  glossary,
}: {
  symbols: S[]
  glossary: Record<S, GlossaryEntry>
}) {
  return (
    <footer className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-border bg-muted/25 px-4 py-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground/80">Where</span>
      {symbols.map((id) => {
        const entry = glossary[id]
        return (
          <span key={id} className="inline-flex items-baseline gap-1">
            <Tex math={entry.tex} className="text-foreground" />
            <span>
              = {inSentence(entry.name)}
              {entry.unit !== "—" && ` (${entry.unit})`}
            </span>
          </span>
        )
      })}
    </footer>
  )
}
