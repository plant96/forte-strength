"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"

import type { WeightUnit } from "@/lib/units"

import { calculateTdee } from "../lib/tdee"
import {
  TDEE_FORM_DEFAULTS,
  tdeeFormSchema,
  toTdeeInput,
  type TdeeFormInput,
  type TdeeFormValues,
} from "../schema"
import { ResultsEmptyState } from "./results/results-empty-state"
import { ResultsPanel } from "./results/results-panel"
import { TdeeForm } from "./tdee-form"

export function TdeeCalculator() {
  const form = useForm<TdeeFormInput, unknown, TdeeFormValues>({
    resolver: zodResolver(tdeeFormSchema),
    defaultValues: TDEE_FORM_DEFAULTS,
    mode: "onTouched",
  })
  /** The last valid set of inputs. Null until the first calculation. */
  const [values, setValues] = useState<TdeeFormValues | null>(null)
  const [goalUnit, setGoalUnit] = useState<WeightUnit>("lb")
  const resultsRef = useRef<HTMLDivElement>(null)
  const hasCalculated = values !== null

  // After the first calculation, results follow the form live. Edits that are
  // temporarily invalid (e.g. a half-typed number) keep the last valid result.
  useEffect(() => {
    if (!hasCalculated) return
    return form.subscribe({
      formState: { values: true },
      callback: ({ values: raw }) => {
        const parsed = tdeeFormSchema.safeParse(raw)
        if (parsed.success) setValues(parsed.data)
      },
    })
  }, [form, hasCalculated])

  function handleCalculate(next: TdeeFormValues) {
    if (!hasCalculated) setGoalUnit(next.weightUnit)
    setValues(next)

    // On narrow screens the results sit below the form, so bring them into view.
    if (window.matchMedia("(max-width: 1023px)").matches) {
      const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
      requestAnimationFrame(() => {
        resultsRef.current?.scrollIntoView({
          behavior: reduceMotion ? "auto" : "smooth",
          block: "start",
        })
      })
    }
  }

  const result = values ? calculateTdee(toTdeeInput(values)) : null

  return (
    <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
      <TdeeForm form={form} onCalculate={handleCalculate} hasCalculated={hasCalculated} />
      <div ref={resultsRef} className="scroll-mt-20">
        {values && result ? (
          <ResultsPanel
            values={values}
            result={result}
            goalUnit={goalUnit}
            onGoalUnitChange={setGoalUnit}
          />
        ) : (
          <ResultsEmptyState />
        )}
      </div>
    </div>
  )
}
