"use client"

import dynamic from "next/dynamic"

import { BreakdownLoading, BreakdownSheetShell } from "@/components/breakdown/breakdown-sheet-shell"

import type { DotsResult } from "../../lib/dots"
import type { ReverseResult } from "../../lib/reverse"
import type { DotsFormValues } from "../../schema"

const loadBreakdownContent = () => import("./breakdown-content")

// KaTeX and the formula content only load the first time the panel opens (or is hovered).
const BreakdownContent = dynamic(() => loadBreakdownContent().then((mod) => mod.BreakdownContent), {
  ssr: false,
  loading: () => <BreakdownLoading />,
})

interface BreakdownSheetProps {
  values: DotsFormValues
  result: DotsResult
  reverse: ReverseResult | null
}

export function BreakdownSheet({ values, result, reverse }: BreakdownSheetProps) {
  const preload = () => void loadBreakdownContent()

  return (
    <BreakdownSheetShell title="How your scores were calculated" onPreload={preload}>
      <BreakdownContent values={values} result={result} reverse={reverse} />
    </BreakdownSheetShell>
  )
}
