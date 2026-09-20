"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, Loader2Icon } from "lucide-react"
import { AnimatePresence, m, useReducedMotion } from "motion/react"
import { useRouter } from "next/navigation"
import { useRef, useState, useTransition } from "react"
import { useForm, useWatch, type FieldPath } from "react-hook-form"
import { toast } from "sonner"

import { StepIndicator } from "@/components/forms/step-indicator"
import { AnimatedNumber } from "@/components/motion/animated-number"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FieldGroup } from "@/components/ui/field"
import {
  BodyFatField,
  HeightField,
  IntensityField,
  SessionsField,
  SexField,
  StepsField,
  WeightField,
} from "@/features/tdee/components/body-fields"
import { getIntensityLevel } from "@/features/tdee/lib/constants"

import { saveProfile, skipOnboarding } from "../actions"
import { ageOn, formatBirthday } from "../lib/birthday"
import { estimateTdee } from "../lib/estimate"
import {
  BIRTHDAY_FIELDS,
  PROFILE_FORM_DEFAULTS,
  profileFormSchema,
  type ProfileFormInput,
  type ProfileFormValues,
} from "../schema"
import { BirthdayField } from "./birthday-field"
import { LiftUnitField } from "./lift-unit-field"

type ProfileForm = ReturnType<typeof useForm<ProfileFormInput, unknown, ProfileFormValues>>

const STEPS = [
  {
    id: "basics",
    title: "The basics",
    description: "Your birthday, sex and size.",
    fields: [...BIRTHDAY_FIELDS, "sex", "weight", "heightFt", "heightIn", "heightCm"],
  },
  {
    id: "composition",
    title: "Body fat",
    description: "Lean mass is one of the three BMR equations the calculator averages.",
    fields: ["bodyFat"],
  },
  {
    id: "activity",
    title: "Activity",
    description: "How much you move and how hard you train.",
    fields: ["steps", "sessions", "intensity", "liftUnit"],
  },
  { id: "review", title: "Review", description: "Make sure everything looks right.", fields: [] },
] as const satisfies ReadonlyArray<{
  id: string
  title: string
  description: string
  fields: ReadonlyArray<FieldPath<ProfileFormInput>>
}>

export function OnboardingWizard({ firstName }: { firstName: string | null }) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: PROFILE_FORM_DEFAULTS,
    mode: "onTouched",
  })
  const [stepIndex, setStepIndex] = useState(0)
  const [highestStep, setHighestStep] = useState(0)
  const [isSaving, startSaving] = useTransition()
  const topRef = useRef<HTMLDivElement>(null)

  const step = STEPS[stepIndex] ?? STEPS[0]
  const isReview = step.id === "review"

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
    const valid = await form.trigger(step.fields, { shouldFocus: true })
    if (valid) goToStep(stepIndex + 1)
  }

  function finish() {
    startSaving(async () => {
      const result = await saveProfile(form.getValues())
      if (result.ok) {
        toast.success("You're all set", {
          description: "Your tools will fill themselves in from now on.",
        })
        router.push("/tools/tdee-calculator")
        return
      }
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          form.setError(field as FieldPath<ProfileFormInput>, { message })
        }
        const firstField = Object.keys(result.fieldErrors)[0]
        const errorStep = STEPS.findIndex((candidate) =>
          (candidate.fields as readonly string[]).includes(firstField ?? ""),
        )
        if (errorStep >= 0) goToStep(errorStep)
      }
      toast.error(result.message)
    })
  }

  return (
    <div ref={topRef} className="flex scroll-mt-24 flex-col gap-6">
      <header className="flex flex-col gap-2">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
          Profile setup
        </p>
        <h1 className="font-heading text-4xl leading-[1.02] font-extrabold uppercase sm:text-5xl">
          {firstName ? `Welcome, ${firstName}` : "Welcome"}
        </h1>
        <p className="text-muted-foreground">
          Save your stats once and every Forte tool fills itself in. It takes about a minute.
        </p>
      </header>

      <StepIndicator
        steps={STEPS}
        stepIndex={stepIndex}
        highestStep={highestStep}
        onSelect={goToStep}
        label="Setup progress"
      />

      <Card className="gap-0 py-0">
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (isReview) finish()
            else void goNext()
          }}
        >
          <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:px-6">
            <h2 className="font-heading text-2xl font-bold uppercase">{step.title}</h2>
            <p className="text-sm text-muted-foreground">{step.description}</p>
          </div>

          <div className="@container p-5 sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <m.div
                key={step.id}
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -24 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {step.id === "basics" && (
                  <FieldGroup className="gap-5">
                    <BirthdayField form={form} />
                    <SexField form={form} />
                    <WeightField form={form} />
                    <HeightField form={form} />
                  </FieldGroup>
                )}
                {step.id === "composition" && <BodyFatField form={form} />}
                {step.id === "activity" && (
                  <FieldGroup className="gap-5">
                    <div className="grid gap-5 @md:grid-cols-2">
                      <StepsField form={form} />
                      <SessionsField form={form} />
                    </div>
                    <IntensityField form={form} />
                    <LiftUnitField form={form} />
                  </FieldGroup>
                )}
                {isReview && <ReviewStep form={form} onEdit={goToStep} />}
              </m.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
            <Button
              type="button"
              variant="ghost"
              onClick={() => goToStep(stepIndex - 1)}
              disabled={stepIndex === 0 || isSaving}
              className={stepIndex === 0 ? "invisible h-10" : "h-10"}
            >
              <ArrowLeftIcon />
              Back
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSaving}
              className="h-11 min-w-36 font-heading text-base font-semibold tracking-wider uppercase"
            >
              {isReview ? (
                isSaving ? (
                  <>
                    <Loader2Icon className="animate-spin" />
                    Saving
                  </>
                ) : (
                  <>
                    <CheckIcon />
                    Finish setup
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

      <form action={skipOnboarding} className="flex justify-center">
        <Button type="submit" variant="link" className="text-muted-foreground">
          Skip for now
        </Button>
      </form>
    </div>
  )
}

function ReviewStep({ form, onEdit }: { form: ProfileForm; onEdit: (step: number) => void }) {
  const values = useWatch({ control: form.control })
  const parsed = profileFormSchema.safeParse({ ...PROFILE_FORM_DEFAULTS, ...values })

  if (!parsed.success) {
    return (
      <p className="text-sm text-muted-foreground">
        Some details are missing. Go back to fill them in.
      </p>
    )
  }

  const profile = parsed.data
  const tdee = estimateTdee(profile).tdee
  const height =
    profile.height.unit === "cm"
      ? `${profile.height.cm} cm`
      : `${profile.height.ft}′ ${profile.height.in}″`
  const rows = [
    {
      label: "Birthday",
      value: `${formatBirthday(profile.birthday)} (age ${ageOn(profile.birthday)})`,
      step: 0,
    },
    { label: "Sex", value: profile.sex === "male" ? "Male" : "Female", step: 0 },
    { label: "Bodyweight", value: `${profile.weight} ${profile.weightUnit}`, step: 0 },
    { label: "Height", value: height, step: 0 },
    { label: "Body fat", value: `${profile.bodyFat}%`, step: 1 },
    { label: "Daily steps", value: profile.steps.toLocaleString("en-US"), step: 2 },
    { label: "Sessions", value: `${profile.sessions} per week`, step: 2 },
    { label: "Intensity", value: getIntensityLevel(profile.intensity).label, step: 2 },
  ]

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col items-center gap-1 rounded-xl bg-primary/10 px-4 py-5 text-center ring-1 ring-primary/30">
        <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          Estimated maintenance
        </p>
        <p className="font-heading text-5xl leading-none font-bold">
          <AnimatedNumber value={tdee} from={0} />
        </p>
        <p className="text-sm text-muted-foreground">kcal per day</p>
      </div>
      <dl className="divide-y divide-border overflow-hidden rounded-xl ring-1 ring-foreground/10">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="flex items-center gap-3 text-right font-medium">
              {row.value}
              <button
                type="button"
                onClick={() => onEdit(row.step)}
                className="text-xs font-normal text-highlight hover:underline"
              >
                Edit
              </button>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
