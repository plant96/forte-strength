"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "cn"
import { ArrowLeftIcon, ArrowRightIcon, Loader2Icon, SendIcon } from "lucide-react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState, useTransition } from "react"
import { useForm, type FieldPath } from "react-hook-form"
import { toast } from "sonner"

import { StepIndicator } from "@/components/forms/step-indicator"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

import { submitApplication } from "../actions"
import {
  APPLICATION_DEFAULTS,
  APPLICATION_STEPS,
  applicationSchema,
  type ApplicationFormInput,
  type ApplicationValues,
} from "../schema"
import { AboutStep, CommitmentStep, LiftingStep, StoryStep } from "./steps"

const DRAFT_KEY = "forte:application-draft:v1"

const STEP_COMPONENTS = [AboutStep, LiftingStep, StoryStep, CommitmentStep]

function stepOfField(field: string) {
  return APPLICATION_STEPS.findIndex((step) => (step.fields as readonly string[]).includes(field))
}

export function ApplicationForm() {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const form = useForm<ApplicationFormInput, unknown, ApplicationValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: APPLICATION_DEFAULTS,
    mode: "onTouched",
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [highestStep, setHighestStep] = useState(0)
  const [isSubmitting, startSubmitting] = useTransition()
  const topRef = useRef<HTMLDivElement>(null)

  const step = APPLICATION_STEPS[stepIndex] ?? APPLICATION_STEPS[0]
  const StepComponent = STEP_COMPONENTS[stepIndex] ?? AboutStep
  const isLastStep = stepIndex === APPLICATION_STEPS.length - 1

  // Restore a saved draft once, then keep saving as they type.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        form.reset({ ...APPLICATION_DEFAULTS, ...JSON.parse(saved), website: "" })
        toast("Welcome back", { description: "We restored the answers you'd already written." })
      }
    } catch {
      // Storage can be unavailable (private mode); the form still works.
    }

    let timeout: number | undefined
    const unsubscribe = form.subscribe({
      formState: { values: true },
      callback: ({ values }) => {
        window.clearTimeout(timeout)
        timeout = window.setTimeout(() => {
          try {
            // Leave the honeypot out of the saved draft.
            localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...values, website: undefined }))
          } catch {
            // Ignore storage errors.
          }
        }, 400)
      },
    })
    return () => {
      window.clearTimeout(timeout)
      unsubscribe()
    }
  }, [form])

  function goToStep(index: number) {
    setStepIndex(index)
    setHighestStep((highest) => Math.max(highest, index))
    requestAnimationFrame(() =>
      topRef.current?.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      }),
    )
  }

  async function goNext() {
    const fields = step.fields as readonly FieldPath<ApplicationFormInput>[]
    const valid = await form.trigger(fields, { shouldFocus: true })
    if (valid) goToStep(stepIndex + 1)
  }

  function submit() {
    startSubmitting(async () => {
      const valid = await form.trigger(undefined, { shouldFocus: false })
      if (!valid) {
        const errorStep = APPLICATION_STEPS.findIndex((candidate) =>
          candidate.fields.some((field) => form.getFieldState(field).invalid),
        )
        if (errorStep >= 0 && errorStep !== stepIndex) goToStep(errorStep)
        toast.error("Some answers need another look.")
        return
      }

      const result = await submitApplication(form.getValues())
      if (result.ok) {
        try {
          localStorage.removeItem(DRAFT_KEY)
        } catch {
          // Ignore storage errors.
        }
        router.push("/application/submitted")
        return
      }

      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          form.setError(field as FieldPath<ApplicationFormInput>, { message })
        }
        const errorStep = stepOfField(Object.keys(result.fieldErrors)[0] ?? "")
        if (errorStep >= 0) goToStep(errorStep)
      }
      toast.error(result.message)
    })
  }

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-5">
      <StepIndicator
        steps={APPLICATION_STEPS}
        stepIndex={stepIndex}
        highestStep={highestStep}
        onSelect={goToStep}
        label="Application progress"
      />

      <Card className="gap-0 py-0">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (isLastStep) submit()
            else void goNext()
          }}
        >
          <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:px-6">
            <p className="font-heading text-xs font-semibold tracking-[0.25em] text-primary uppercase">
              Step {stepIndex + 1} of {APPLICATION_STEPS.length}
            </p>
            <h2 className="font-heading text-2xl font-bold uppercase">{step.title}</h2>
          </div>

          <div className="p-5 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={step.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                <StepComponent form={form} />
              </m.div>
            </AnimatePresence>

            {/* Honeypot: invisible to people, tempting to bots. */}
            <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
              <label htmlFor="website">Website</label>
              <input id="website" tabIndex={-1} autoComplete="off" {...form.register("website")} />
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => goToStep(stepIndex - 1)}
              disabled={stepIndex === 0 || isSubmitting}
              className={cn("h-10", stepIndex === 0 && "invisible")}
            >
              <ArrowLeftIcon />
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting}
              className="h-11 min-w-40 font-heading text-base font-semibold tracking-wider uppercase"
            >
              {isLastStep ? (
                isSubmitting ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Submitting
                  </>
                ) : (
                  <>
                    <SendIcon />
                    Submit application
                  </>
                )
              ) : (
                <>
                  Continue
                  <ArrowRightIcon />
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>
      <p className="text-center text-xs text-muted-foreground">
        Your answers are saved on this device as you go, so you can come back later.
      </p>
    </div>
  )
}
