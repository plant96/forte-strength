"use client"

import dynamic from "next/dynamic"

import { BreakdownLoading, BreakdownSheetShell } from "@/components/breakdown/breakdown-sheet-shell"
import type { WeightUnit } from "@/lib/units"

import type { CalorieTarget } from "../../lib/macros"
import type { TdeeResult } from "../../lib/tdee"
import type { TdeeFormValues } from "../../schema"

const loadBreakdownContent = () => import("./breakdown-content")

// KaTeX and the formula content only load the first time the panel opens (or is hovered).
const BreakdownContent = dynamic(() => loadBreakdownContent().then((mod) => mod.BreakdownContent), {
  ssr: false,
  loading: () => <BreakdownLoading />,
})

interface BreakdownSheetProps {
  values: TdeeFormValues
  result: TdeeResult
  goalUnit: WeightUnit
  calorieTarget: CalorieTarget
}

export function BreakdownSheet({ values, result, goalUnit, calorieTarget }: BreakdownSheetProps) {
  const preload = () => void loadBreakdownContent()

  return (
    <BreakdownSheetShell title="How your TDEE was calculated" onPreload={preload}>
      <BreakdownContent
        values={values}
        result={result}
        goalUnit={goalUnit}
        calorieTarget={calorieTarget}
      />
    </BreakdownSheetShell>
  )
}
