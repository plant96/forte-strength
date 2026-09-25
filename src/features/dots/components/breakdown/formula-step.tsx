import { cn } from "cn"

import { FormulaStepCard } from "@/components/breakdown/formula-step-card"
import { Tex } from "@/components/math/tex"

import { AGE_COEFFICIENT_TABLE, type AgeCoefficient } from "../../lib/age-coefficient"
import type { DotsBreakdown, DotsFormulaStep } from "../../lib/formulas"
import { DOTS_GLOSSARY } from "../../lib/glossary"

interface DotsFormulaStepCardProps {
  step: DotsFormulaStep
  breakdown: DotsBreakdown
}

/** The shared step card, plus the age coefficient table only this calculator needs. */
export function DotsFormulaStepCard({ step, breakdown }: DotsFormulaStepCardProps) {
  return (
    <FormulaStepCard
      step={step}
      glossary={DOTS_GLOSSARY}
      extra={step.extra === "age-table" ? <AgeTable age={breakdown.age} /> : null}
    />
  )
}

interface AgeTableRow {
  label: string
  ages: [number, number]
  coefficient: number
}

/** The table as printed: youth and masters ages listed, the open years collapsed into one row. */
const AGE_TABLE_ROWS: AgeTableRow[] = AGE_COEFFICIENT_TABLE.flatMap((row, index, table) => {
  const next = table[index + 1]
  if (row.age === 23 && next?.age === 39) {
    return [{ label: `${row.age}–${next.age}`, ages: [row.age, next.age], coefficient: 1 }]
  }
  if (row.age === 39) return []
  return [{ label: `${row.age}`, ages: [row.age, row.age], coefficient: row.coefficient }]
})

function AgeTable({ age }: { age: AgeCoefficient }) {
  const isYours = (row: AgeTableRow) =>
    (row.ages[0] <= age.usedAge && age.usedAge <= row.ages[1]) ||
    row.ages[0] === age.lower.age ||
    row.ages[0] === age.upper.age

  return (
    <div className="mx-4 mb-4 overflow-hidden rounded-lg ring-1 ring-foreground/10">
      <table className="w-full text-sm">
        <caption className="sr-only">Age coefficients</caption>
        <thead className="bg-muted/40 text-xs text-muted-foreground">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Age
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              <Tex math="C_{\text{age}}" />
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {AGE_TABLE_ROWS.map((row) => {
            const active = isYours(row)
            return (
              <tr key={row.label} className={cn(active && "bg-primary/10")}>
                <td className="px-3 py-1.5 tabular-nums">
                  {row.label}
                  {active && (
                    <span className="ml-2 text-xs font-medium text-highlight">
                      {age.interpolated ? "Between these" : "Yours"}
                    </span>
                  )}
                </td>
                <td
                  className={cn(
                    "px-3 py-1.5 text-right tabular-nums",
                    active && "font-semibold text-highlight",
                  )}
                >
                  {row.coefficient.toFixed(3)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
