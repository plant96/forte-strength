"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { FlameIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import type { AccountState } from "@/components/account/account-nudge"
import { ResultsEmptyState } from "@/components/tools/results-empty-state"
import type { WeightUnit } from "@/lib/units"

import { calculateGoalTargets } from "../lib/goals"
import { resolveCalorieTarget, type CalorieTargetId } from "../lib/macros"
import { calculateTdee } from "../lib/tdee"
import {
  TDEE_FORM_DEFAULTS,
  tdeeFormSchema,
  toTdeeInput,
  type TdeeFormInput,
  type TdeeFormValues,
} from "../schema"
import { MacroSection } from "./results/macro-section"
import { ResultsPanel } from "./results/results-panel"
import { TdeeForm } from "./tdee-form"

interface TdeeCalculatorProps {
  /** Values from the signed-in user's profile. Every field stays editable. */
  initialValues?: TdeeFormInput
  /** Drives the sign-up / finish-your-profile prompt beside the form heading. */
  accountState?: AccountState
}

export function TdeeCalculator({ initialValues, accountState = "complete" }: TdeeCalculatorProps) {
  const router = useRouter()
  const form = useForm<TdeeFormInput, unknown, TdeeFormValues>({
    resolver: zodResolver(tdeeFormSchema),
    defaultValues: initialValues ?? TDEE_FORM_DEFAULTS,
    mode: "onTouched",
  })
  const autofilled = initialValues !== undefined

  // Let people know where the numbers came from, and where to change them for good.
  useEffect(() => {
    if (!autofilled) return
    toast("Information was autofilled from your profile", {
      id: "profile-autofill",
      description: "You can change anything here, or update it anytime in settings.",
      duration: 7000,
      action: { label: "Settings", onClick: () => router.push("/profile") },
    })
  }, [autofilled, router])

  /** The last valid set of inputs. Null until the first calculation. */
  const [values, setValues] = useState<TdeeFormValues | null>(null)
  const [goalUnit, setGoalUnit] = useState<WeightUnit>("lb")
  /** Which calorie target the macro splits are built from. */
  const [calorieTargetId, setCalorieTargetId] = useState<CalorieTargetId>("maintenance")
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
  const goals = result ? calculateGoalTargets(result.tdee, result.bmr.average, goalUnit) : null
  const calorieTarget =
    result && goals ? resolveCalorieTarget(calorieTargetId, result.tdee, goals) : null

  return (
    <div className="flex flex-col gap-12 lg:gap-14">
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <TdeeForm
          form={form}
          onCalculate={handleCalculate}
          hasCalculated={hasCalculated}
          accountState={accountState}
        />
        <div ref={resultsRef} className="scroll-mt-20">
          {values && result && goals && calorieTarget ? (
            <ResultsPanel
              values={values}
              result={result}
              goals={goals}
              goalUnit={goalUnit}
              calorieTarget={calorieTarget}
              onGoalUnitChange={setGoalUnit}
            />
          ) : (
            <ResultsEmptyState icon={FlameIcon}>
              Fill in your stats and press <span className="text-foreground">Calculate TDEE</span>{" "}
              to see your maintenance calories, plus daily targets to bulk or cut.
            </ResultsEmptyState>
          )}
        </div>
      </div>

      {result && goals && calorieTarget && (
        <MacroSection
          tdee={result.tdee}
          goals={goals}
          target={calorieTarget}
          onTargetChange={setCalorieTargetId}
        />
      )}
    </div>
  )
}
