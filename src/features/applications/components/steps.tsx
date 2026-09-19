"use client"

import { cn } from "cn"
import { CheckCircle2Icon, QuoteIcon } from "lucide-react"
import { AnimatePresence, m } from "motion/react"
import { Controller, useWatch, type UseFormReturn } from "react-hook-form"

import { UnitInput } from "@/components/forms/unit-input"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group"
import { Input } from "@/components/ui/input"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { parseNumberInput } from "@/lib/forms/reader"

import {
  COACHING_NEEDS,
  CURRENT_COACH_OPTIONS,
  FINANCE_OPTIONS,
  QUESTIONS,
  READINESS_OPTIONS,
} from "../options"
import { isCommitmentPhrase, type ApplicationFormInput, type ApplicationValues } from "../schema"
import { LongTextField, TextField } from "./application-fields"
import { ChoiceCards } from "./choice-cards"

type ApplicationForm = UseFormReturn<ApplicationFormInput, unknown, ApplicationValues>

export function AboutStep({ form }: { form: ApplicationForm }) {
  const { control } = form
  return (
    <div className="@container grid gap-5 @md:grid-cols-2">
      <TextField
        control={control}
        name="fullName"
        label={QUESTIONS.fullName.label}
        autoComplete="name"
        placeholder="Jordan Smith"
      />
      <Controller
        name="age"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="age">{QUESTIONS.age.label}</FieldLabel>
            <UnitInput
              {...field}
              id="age"
              inputMode="numeric"
              placeholder="27"
              suffix="years"
              aria-invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <TextField
        control={control}
        name="email"
        label={QUESTIONS.email.label}
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
      />
      <TextField
        control={control}
        name="phone"
        label={QUESTIONS.phone.label}
        type="tel"
        autoComplete="tel"
        placeholder="(407) 555-0123"
      />
      <TextField
        control={control}
        name="location"
        label={QUESTIONS.location.label}
        hint={QUESTIONS.location.hint}
        placeholder="Orlando, Florida"
      />
      <Controller
        name="instagram"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid} className="@md:mt-auto">
            <FieldLabel htmlFor="instagram">{QUESTIONS.instagram.label}</FieldLabel>
            <InputGroup className="h-10">
              <InputGroupAddon align="inline-start">
                <InputGroupText>@</InputGroupText>
              </InputGroupAddon>
              <InputGroupInput
                {...field}
                id="instagram"
                autoComplete="off"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="yourhandle"
                aria-invalid={fieldState.invalid}
                className="placeholder:text-muted-foreground/45"
              />
            </InputGroup>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}

const LIFTS = [
  { name: "squat", label: "Squat" },
  { name: "bench", label: "Bench" },
  { name: "deadlift", label: "Deadlift" },
] as const

export function LiftingStep({ form }: { form: ApplicationForm }) {
  const { control } = form
  const [primaryNeed, liftUnit, squat, bench, deadlift] = useWatch({
    control,
    name: ["primaryNeed", "liftUnit", "squat", "bench", "deadlift"],
  })
  const lifts = [squat, bench, deadlift].map(parseNumberInput)
  const total = lifts.every((lift) => lift !== null)
    ? lifts.reduce<number>((sum, lift) => sum + (lift ?? 0), 0)
    : null

  return (
    <div className="flex flex-col gap-7">
      <Controller
        name="primaryNeed"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel id="primaryNeed-label" asChild>
              <span>{QUESTIONS.primaryNeed.label}</span>
            </FieldLabel>
            <ChoiceCards
              name="primaryNeed"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={COACHING_NEEDS}
              labelledBy="primaryNeed-label"
              invalid={fieldState.invalid}
              columns={2}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <AnimatePresence initial={false}>
        {primaryNeed === "OTHER" && (
          <m.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="-mt-3 overflow-hidden"
          >
            <TextField
              control={control}
              name="primaryNeedOther"
              label="Tell us your primary need"
              placeholder="e.g. Strongman, general strength, rehab after injury"
            />
          </m.div>
        )}
      </AnimatePresence>

      <Field>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div className="flex flex-col gap-1">
            <FieldLabel asChild>
              <span>{QUESTIONS.lifts.label}</span>
            </FieldLabel>
            <FieldDescription>{QUESTIONS.lifts.hint}</FieldDescription>
          </div>
          <Controller
            name="liftUnit"
            control={control}
            render={({ field }) => (
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                spacing={0}
                value={field.value}
                onValueChange={(next) => {
                  if (next) field.onChange(next)
                }}
                aria-label="Unit for your lifts"
              >
                <ToggleGroupItem value="lb" className="px-3 data-[state=on]:bg-primary/15">
                  lb
                </ToggleGroupItem>
                <ToggleGroupItem value="kg" className="px-3 data-[state=on]:bg-primary/15">
                  kg
                </ToggleGroupItem>
              </ToggleGroup>
            )}
          />
        </div>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {LIFTS.map((lift) => (
            <Controller
              key={lift.name}
              name={lift.name}
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid} className="gap-1.5">
                  <FieldLabel htmlFor={lift.name} className="text-xs text-muted-foreground">
                    {lift.label}
                  </FieldLabel>
                  <UnitInput
                    {...field}
                    id={lift.name}
                    inputMode="decimal"
                    placeholder="0"
                    suffix={liftUnit}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} className="text-xs" />
                </Field>
              )}
            />
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/30 px-3 py-2.5 ring-1 ring-foreground/5">
          <Controller
            name="liftsAreCompetition"
            control={control}
            render={({ field }) => (
              <label
                htmlFor="liftsAreCompetition"
                className="flex cursor-pointer items-center gap-2.5 text-sm"
              >
                <Checkbox
                  id="liftsAreCompetition"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                />
                These are competition numbers
              </label>
            )}
          />
          <p className="text-sm text-muted-foreground">
            Total{" "}
            <span className="font-heading text-lg font-bold text-foreground tabular-nums">
              {total === null ? "—" : total.toLocaleString("en-US", { maximumFractionDigits: 1 })}
            </span>{" "}
            {liftUnit}
          </p>
        </div>
      </Field>

      <TextField
        control={control}
        name="weightClass"
        label={QUESTIONS.weightClass.label}
        hint={QUESTIONS.weightClass.hint}
        placeholder="e.g. 93 kg, or 205 lb bodyweight"
      />
    </div>
  )
}

const SCALE = Array.from({ length: 10 }, (_, index) => String(index + 1))

export function StoryStep({ form }: { form: ApplicationForm }) {
  const { control } = form
  return (
    <div className="flex flex-col gap-7">
      <LongTextField
        control={control}
        name="goals"
        label={QUESTIONS.goals.label}
        hint={QUESTIONS.goals.hint}
        size="lg"
      />
      <LongTextField
        control={control}
        name="challenges"
        label={QUESTIONS.challenges.label}
        hint={QUESTIONS.challenges.hint}
        size="lg"
      />
      <Controller
        name="overthinker"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel id="overthinker-label" asChild>
              <span className="leading-snug">{QUESTIONS.overthinker.label}</span>
            </FieldLabel>
            <ToggleGroup
              type="single"
              variant="outline"
              spacing={0}
              value={field.value}
              onValueChange={(next) => {
                if (next) field.onChange(next)
              }}
              aria-labelledby="overthinker-label"
              aria-invalid={fieldState.invalid}
              className="grid w-full grid-cols-5 sm:grid-cols-10"
            >
              {SCALE.map((value) => (
                <ToggleGroupItem
                  key={value}
                  value={value}
                  onBlur={field.onBlur}
                  className="h-11 w-full font-heading text-base font-bold tabular-nums data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                >
                  {value}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 · Rarely</span>
              <span>10 · Constantly</span>
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <LongTextField
        control={control}
        name="injuries"
        label={QUESTIONS.injuries.label}
        hint={QUESTIONS.injuries.hint}
      />
      <LongTextField
        control={control}
        name="nutritionRestrictions"
        label={QUESTIONS.nutritionRestrictions.label}
        hint={QUESTIONS.nutritionRestrictions.hint}
      />
      <LongTextField
        control={control}
        name="programming"
        label={QUESTIONS.programming.label}
        size="lg"
      />
    </div>
  )
}

export function CommitmentStep({ form }: { form: ApplicationForm }) {
  const { control } = form
  const commitment = useWatch({ control, name: "commitment" })
  const committed = isCommitmentPhrase(commitment)

  return (
    <div className="flex flex-col gap-7">
      <Controller
        name="currentCoach"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel id="currentCoach-label" asChild>
              <span>{QUESTIONS.currentCoach.label}</span>
            </FieldLabel>
            <ChoiceCards
              name="currentCoach"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={CURRENT_COACH_OPTIONS}
              labelledBy="currentCoach-label"
              invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
      <LongTextField
        control={control}
        name="whyForte"
        label={QUESTIONS.whyForte.label}
        hint={QUESTIONS.whyForte.hint}
        size="lg"
      />

      <Controller
        name="commitment"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor="commitment">{QUESTIONS.commitment.label}</FieldLabel>
            <div className="flex gap-3 rounded-xl bg-primary/10 p-4 text-sm leading-relaxed ring-1 ring-primary/25">
              <QuoteIcon className="mt-0.5 size-4 shrink-0 text-highlight" aria-hidden="true" />
              <p>{QUESTIONS.commitment.hint}</p>
            </div>
            <div className="relative">
              <Input
                {...field}
                id="commitment"
                autoComplete="off"
                placeholder="I am prepared"
                aria-invalid={fieldState.invalid}
                className={cn(
                  "h-11 pr-10 font-heading text-base tracking-wide placeholder:text-muted-foreground/40",
                  committed && "border-primary/60",
                )}
              />
              {committed && (
                <CheckCircle2Icon
                  className="absolute top-1/2 right-3 size-5 -translate-y-1/2 text-highlight"
                  aria-label="Commitment confirmed"
                />
              )}
            </div>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name="financePriority"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel id="financePriority-label" asChild>
              <span>{QUESTIONS.financePriority.label}</span>
            </FieldLabel>
            <ChoiceCards
              name="financePriority"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={FINANCE_OPTIONS}
              labelledBy="financePriority-label"
              invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name="readiness"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel id="readiness-label" asChild>
              <span>{QUESTIONS.readiness.label}</span>
            </FieldLabel>
            <FieldDescription className="-mt-1">{QUESTIONS.readiness.hint}</FieldDescription>
            <ChoiceCards
              name="readiness"
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              options={READINESS_OPTIONS}
              labelledBy="readiness-label"
              invalid={fieldState.invalid}
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    </div>
  )
}
