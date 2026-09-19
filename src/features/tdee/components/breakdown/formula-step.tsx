import { cn } from "cn"
import { InfoIcon } from "lucide-react"

import { Tex } from "@/components/math/tex"

import { INTENSITY_LEVELS, type IntensityId } from "../../lib/constants"
import { formatNumber, type Breakdown, type FormulaStep, type StepResult } from "../../lib/formulas"
import { GLOSSARY, type SymbolId } from "../../lib/glossary"
import { Gauge } from "./gauge"

interface FormulaStepCardProps {
  step: FormulaStep
  breakdown: Breakdown
}

/** One step of the calculation: the formula, the same formula with your numbers, and the result. */
export function FormulaStepCard({ step, breakdown }: FormulaStepCardProps) {
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
            <ResultValue result={step.result} />
          </FormulaRow>
        )}
      </dl>

      {step.gauge && <Gauge gauge={step.gauge} label={step.title} />}
      {step.extra === "intensity-table" && <IntensityTable activeId={breakdown.intensityId} />}
      {step.extra === "targets-table" && <TargetsTable breakdown={breakdown} />}

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

      <WhereLine symbols={step.symbols} />
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

function ResultValue({ result }: { result: StepResult }) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-2">
      {result.symbol && (
        <span className="text-muted-foreground">
          <Tex math={`${GLOSSARY[result.symbol].tex} =`} />
        </span>
      )}
      <span className="font-heading text-2xl font-bold tabular-nums">
        {formatNumber(result.value, result.decimals)}
      </span>
      {result.unit && <span className="text-sm text-muted-foreground">{result.unit}</span>}
    </p>
  )
}

function WhereLine({ symbols }: { symbols: SymbolId[] }) {
  return (
    <footer className="flex flex-wrap items-baseline gap-x-4 gap-y-1 border-t border-border bg-muted/25 px-4 py-3 text-xs text-muted-foreground">
      <span className="font-semibold text-foreground/80">Where</span>
      {symbols.map((id) => {
        const entry = GLOSSARY[id]
        return (
          <span key={id} className="inline-flex items-baseline gap-1">
            <Tex math={entry.tex} className="text-foreground" />
            <span>
              = {entry.name.toLowerCase()}
              {entry.unit !== "—" && ` (${entry.unit})`}
            </span>
          </span>
        )
      })}
    </footer>
  )
}

function IntensityTable({ activeId }: { activeId: IntensityId }) {
  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <caption className="sr-only">Intensity scores</caption>
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Intensity
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              <Tex math="I" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {INTENSITY_LEVELS.map((level) => {
            const active = level.id === activeId
            return (
              <tr key={level.id} className={cn(active && "bg-primary/10")}>
                <td className="px-3 py-1.5">
                  {level.label}
                  {active && <span className="ml-2 text-xs font-medium text-highlight">Yours</span>}
                </td>
                <td
                  className={cn(
                    "px-3 py-1.5 text-right tabular-nums",
                    active && "font-semibold text-highlight",
                  )}
                >
                  {level.score.toFixed(2)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

function TargetsTable({ breakdown }: { breakdown: Breakdown }) {
  const { targets, goalUnit } = breakdown

  return (
    <div className="mx-4 mb-4 overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <table className="w-full min-w-104 text-sm tabular-nums">
        <caption className="sr-only">Daily calorie targets for each weekly rate</caption>
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Rate / week
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              <Tex math="\Delta" /> (kcal/day)
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium text-cut">
              Cut
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium text-bulk">
              Bulk
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {targets.cut.map((cut, index) => {
            const bulk = targets.bulk[index]
            return (
              <tr key={cut.rate}>
                <th scope="row" className="px-3 py-2 text-left font-medium">
                  {formatNumber(cut.rate, 2)} {goalUnit}
                </th>
                <td className="px-3 py-2 text-right">{formatNumber(cut.dailyDelta, 1)}</td>
                <td className="px-3 py-2 text-right">
                  {formatNumber(cut.calories, 0)}
                  {cut.belowBmr && (
                    <span className="ml-1 text-[0.65rem] text-destructive" title="Below BMR">
                      ▼BMR
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {bulk ? formatNumber(bulk.calories, 0) : "—"}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
