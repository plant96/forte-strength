"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { MedalIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import type { AccountState } from "@/components/account/account-nudge"
import { ResultsEmptyState } from "@/components/tools/results-empty-state"

import type { ScoreKind } from "../lib/constants"
import { calculateDots } from "../lib/dots"
import { calculateRequiredTotal } from "../lib/reverse"
import {
  DOTS_FORM_DEFAULTS,
  dotsFormSchema,
  parseDesiredScore,
  toDotsInput,
  type DotsFormInput,
  type DotsFormValues,
} from "../schema"
import { DotsForm } from "./dots-form"
import { ScoresPanel } from "./results/scores-panel"
import { ReverseSection, type ReverseTarget } from "./reverse/reverse-section"

interface DotsCalculatorProps {
  /** Values from the signed-in user's profile (and PR tracker). Every field stays editable. */
  initialValues?: DotsFormInput
  /** True when the total was filled from the PR tracker's best 1RMs. */
  totalFromPrs?: boolean
  /** Drives the sign-up / finish-your-profile prompt beside the form heading. */
  accountState?: AccountState
}

export function DotsCalculator({
  initialValues,
  totalFromPrs = false,
  accountState = "complete",
}: DotsCalculatorProps) {
  const router = useRouter()
  const form = useForm<DotsFormInput, unknown, DotsFormValues>({
    resolver: zodResolver(dotsFormSchema),
    defaultValues: initialValues ?? DOTS_FORM_DEFAULTS,
    mode: "onTouched",
  })
  const autofilled = initialValues !== undefined

  // Let people know where the numbers came from, and where to change them for good.
  useEffect(() => {
    if (!autofilled) return
    toast(
      totalFromPrs
        ? "Information was autofilled from your profile and PR tracker"
        : "Information was autofilled from your profile",
      {
        id: "profile-autofill",
        description: totalFromPrs
          ? "Your total is your best squat, bench and deadlift 1RMs. You can change anything here, or update it anytime in settings."
          : "You can change anything here, or update it anytime in settings.",
        duration: 7000,
        action: { label: "Settings", onClick: () => router.push("/profile") },
      },
    )
  }, [autofilled, totalFromPrs, router])

  /** The last valid set of inputs. Null until the first calculation. */
  const [values, setValues] = useState<DotsFormValues | null>(null)
  /** The reverse calculator's target, kept as typed so a half-typed number survives. */
  const [target, setTarget] = useState<ReverseTarget>({ kind: "dots", score: "" })
  const resultsRef = useRef<HTMLDivElement>(null)
  const hasCalculated = values !== null

  // After the first calculation, results follow the form live. Edits that are
  // temporarily invalid (e.g. a half-typed number) keep the last valid result.
  useEffect(() => {
    if (!hasCalculated) return
    return form.subscribe({
      formState: { values: true },
      callback: ({ values: raw }) => {
        const parsed = dotsFormSchema.safeParse(raw)
        if (parsed.success) setValues(parsed.data)
      },
    })
  }, [form, hasCalculated])

  function handleCalculate(next: DotsFormValues) {
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

  const result = values ? calculateDots(toDotsInput(values)) : null
  const desired = parseDesiredScore(target.score, target.kind)
  const reverse =
    result && desired?.value != null
      ? calculateRequiredTotal({
          kind: target.kind as ScoreKind,
          score: desired.value,
          bodyweightKg: result.input.bodyweightKg,
          ageYears: result.input.ageYears,
          sex: result.input.sex,
        })
      : null

  return (
    <div className="flex flex-col gap-12 lg:gap-14">
      <div className="grid items-start gap-6 lg:grid-cols-2 lg:gap-8">
        <DotsForm
          form={form}
          onCalculate={handleCalculate}
          hasCalculated={hasCalculated}
          accountState={accountState}
        />
        <div ref={resultsRef} className="scroll-mt-20">
          {values && result ? (
            <ScoresPanel values={values} result={result} reverse={reverse} />
          ) : (
            <ResultsEmptyState icon={MedalIcon}>
              Fill in your lifts and press <span className="text-foreground">Calculate scores</span>{" "}
              to see your DOTS, age-adjusted DOTS and GLP.
            </ResultsEmptyState>
          )}
        </div>
      </div>

      {values && result && (
        <ReverseSection
          values={values}
          result={result}
          target={target}
          onTargetChange={setTarget}
          desired={desired}
          reverse={reverse}
        />
      )}
    </div>
  )
}
