"use client"

import { SigmaIcon } from "lucide-react"
import dynamic from "next/dynamic"

import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
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
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className="h-12 w-full gap-2 text-sm font-semibold"
          onPointerEnter={preload}
          onFocus={preload}
        >
          <SigmaIcon className="text-primary" />
          View the calculations
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="gap-0 p-0 data-[side=right]:w-full data-[side=right]:sm:max-w-2xl"
      >
        <SheetHeader className="border-b border-border px-5 pt-5 pb-4">
          <SheetTitle className="font-heading text-xl font-bold tracking-wide uppercase">
            How your TDEE was calculated
          </SheetTitle>
          <SheetDescription>
            Every formula with your numbers filled in, step by step. Highlighted values are yours.
          </SheetDescription>
        </SheetHeader>
        <div id="breakdown-scroll" className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <BreakdownContent
            values={values}
            result={result}
            goalUnit={goalUnit}
            calorieTarget={calorieTarget}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}

function BreakdownLoading() {
  return (
    <div className="flex flex-col gap-4 p-5" aria-busy="true" aria-label="Loading calculations">
      {Array.from({ length: 4 }, (_, index) => (
        <div key={index} className="h-32 animate-pulse rounded-xl bg-muted/50" />
      ))}
    </div>
  )
}
