import { cn } from "cn"

import { FormulaStepCard as SharedFormulaStepCard } from "@/components/breakdown/formula-step-card"
import { Tex } from "@/components/math/tex"

import { INTENSITY_LEVELS, type IntensityId } from "../../lib/constants"
import { formatNumber, type Breakdown, type FormulaStep } from "../../lib/formulas"
import { GLOSSARY } from "../../lib/glossary"
import { MACRO_INFO, MACROS } from "../../lib/macros"

interface FormulaStepCardProps {
  step: FormulaStep
  breakdown: Breakdown
}

/** The shared step card, plus the reference tables only the TDEE calculation needs. */
export function FormulaStepCard({ step, breakdown }: FormulaStepCardProps) {
  return (
    <SharedFormulaStepCard
      step={step}
      glossary={GLOSSARY}
      extra={
        step.extra === "intensity-table" ? (
          <IntensityTable activeId={breakdown.intensityId} />
        ) : step.extra === "targets-table" ? (
          <TargetsTable breakdown={breakdown} />
        ) : step.extra === "macros-table" ? (
          <MacrosTable breakdown={breakdown} />
        ) : null
      }
    />
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
                  <span className="block text-xs text-muted-foreground">{level.description}</span>
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

function MacrosTable({ breakdown }: { breakdown: Breakdown }) {
  const { diets, target } = breakdown.macros

  return (
    <div className="mx-4 mb-4 overflow-x-auto rounded-lg ring-1 ring-foreground/10">
      <table className="w-full min-w-104 text-sm tabular-nums">
        <caption className="sr-only">
          Grams per day for each macro split at {formatNumber(target.calories, 0)} kcal
        </caption>
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Split
            </th>
            {MACROS.map((macro) => (
              <th key={macro} scope="col" className="px-3 py-2 text-right font-medium">
                {MACRO_INFO[macro].label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {diets.map(({ split, amounts }) => (
            <tr key={split.id}>
              <th scope="row" className="px-3 py-2 text-left font-medium">
                {split.name}
                {split.coachFavorite && (
                  <span className="ml-1.5 text-[0.65rem] font-medium text-highlight">
                    ★ Coach Ty&apos;s favorite
                  </span>
                )}
              </th>
              {amounts.map((amount) => (
                <td key={amount.macro} className="px-3 py-2 text-right">
                  {formatNumber(amount.grams, 0)} g
                  <span className="block text-[0.7rem] text-muted-foreground">
                    {amount.percent}%
                  </span>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
