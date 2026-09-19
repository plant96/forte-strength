"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, MapPinIcon, MinusIcon, PlusIcon, SaveIcon } from "lucide-react"
import { useTransition } from "react"
import {
  Controller,
  useForm,
  useFormState,
  useWatch,
  type Control,
  type FieldPath,
} from "react-hook-form"
import { toast } from "sonner"

import { SectionLegend } from "@/components/forms/section-legend"
import { UnitInput } from "@/components/forms/unit-input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  COACH_PROFILE_DEFAULTS,
  coachReachSentence,
  coachRecords,
  type CoachProfileData,
} from "@/config/coaching"
import { coachProfileSchema, parseReach, type CoachProfileFormInput } from "@/features/coach/schema"
import { parseNumberInput } from "@/lib/forms/reader"

import { updateCoachProfile } from "../actions"

type CoachControl = Control<CoachProfileFormInput, unknown, CoachProfileData>

export function CoachProfileForm({ initialValues }: { initialValues: CoachProfileFormInput }) {
  const form = useForm<CoachProfileFormInput, unknown, CoachProfileData>({
    resolver: zodResolver(coachProfileSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  })
  const { isDirty } = useFormState({ control: form.control })
  const [isSaving, startSaving] = useTransition()

  const onSubmit = form.handleSubmit(() => {
    startSaving(async () => {
      const values = form.getValues()
      const result = await updateCoachProfile(values)
      if (result.ok) {
        form.reset(values)
        toast.success("Coach profile updated", {
          description: "The new details are live across the site.",
        })
        return
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as FieldPath<CoachProfileFormInput>, { message })
      }
      toast.error(result.message)
    })
  })

  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
      <Card className="gap-0 py-0">
        <form onSubmit={onSubmit} noValidate className="flex flex-col">
          <div className="@container flex flex-col gap-8 p-5 sm:p-6">
            <FieldSet>
              <SectionLegend index="01">Records</SectionLegend>
              <FieldDescription>
                These counts appear on the home page and under the calculator. Update them as your
                athletes set new ones.
              </FieldDescription>
              <div className="grid gap-3 @md:grid-cols-3">
                <RecordStepper
                  control={form.control}
                  setValue={form.setValue}
                  name="worldRecords"
                  label="World records"
                />
                <RecordStepper
                  control={form.control}
                  setValue={form.setValue}
                  name="americanRecords"
                  label="American records"
                />
                <RecordStepper
                  control={form.control}
                  setValue={form.setValue}
                  name="stateRecords"
                  label="State records"
                />
              </div>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <SectionLegend index="02">About the coach</SectionLegend>
              <FieldGroup className="gap-5">
                <div className="grid gap-5 @md:grid-cols-2">
                  <TextInput control={form.control} name="name" label="Name" />
                  <TextInput
                    control={form.control}
                    name="title"
                    label="Title"
                    placeholder="Head Coach"
                  />
                </div>
                <TextInput
                  control={form.control}
                  name="credentials"
                  label="Credentials"
                  hint="Separate with “·”. Each one becomes a chip on the home page."
                />
                <Controller
                  name="yearsExperience"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="@md:max-w-48">
                      <FieldLabel htmlFor="yearsExperience">Coaching experience</FieldLabel>
                      <UnitInput
                        {...field}
                        id="yearsExperience"
                        inputMode="numeric"
                        suffix="+ years"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
                <Controller
                  name="bio"
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="bio">Bio</FieldLabel>
                      <Textarea
                        {...field}
                        id="bio"
                        aria-invalid={fieldState.invalid}
                        className="min-h-32 text-sm leading-relaxed"
                      />
                      <FieldDescription>Shown in the “Meet your coach” section.</FieldDescription>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </FieldGroup>
            </FieldSet>

            <FieldSeparator />

            <FieldSet>
              <SectionLegend index="03">Team reach</SectionLegend>
              <FieldGroup className="gap-5">
                <TextInput
                  control={form.control}
                  name="homeBase"
                  label="Home base"
                  placeholder="Orlando, FL"
                />
                <TextInput
                  control={form.control}
                  name="reach"
                  label="Where your lifters are"
                  hint="Comma-separated, e.g. 12 states, the UK, Romania, Canada"
                />
              </FieldGroup>
            </FieldSet>
          </div>

          <div className="flex flex-col-reverse items-stretch gap-3 border-t border-border p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <p className="text-center text-xs text-muted-foreground sm:text-left">
              {isDirty ? "You have unsaved changes." : "Everything's up to date."}
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={isSaving || !isDirty}
              className="h-11 min-w-40 font-heading text-base font-semibold tracking-wider uppercase"
            >
              {isSaving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
              {isSaving ? "Saving" : "Save changes"}
            </Button>
          </div>
        </form>
      </Card>

      <Preview control={form.control} />
    </div>
  )
}

function TextInput({
  control,
  name,
  label,
  hint,
  placeholder,
}: {
  control: CoachControl
  name: "name" | "title" | "credentials" | "homeBase" | "reach"
  label: string
  hint?: string
  placeholder?: string
}) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          <Input
            {...field}
            id={name}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            className="h-10"
          />
          {hint && <FieldDescription>{hint}</FieldDescription>}
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

function RecordStepper({
  control,
  setValue,
  name,
  label,
}: {
  control: CoachControl
  setValue: ReturnType<typeof useForm<CoachProfileFormInput, unknown, CoachProfileData>>["setValue"]
  name: "worldRecords" | "americanRecords" | "stateRecords"
  label: string
}) {
  const value = useWatch({ control, name })
  const current = parseNumberInput(value) ?? 0

  function bump(delta: number) {
    setValue(name, String(Math.max(0, Math.round(current) + delta)), {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field
          data-invalid={fieldState.invalid}
          className="items-center gap-2 rounded-xl bg-background/50 p-4 text-center ring-1 ring-foreground/10"
        >
          <FieldLabel htmlFor={name} className="text-xs text-muted-foreground">
            {label}
          </FieldLabel>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`One fewer ${label.toLowerCase()}`}
              onClick={() => bump(-1)}
            >
              <MinusIcon />
            </Button>
            <Input
              {...field}
              id={name}
              inputMode="numeric"
              aria-invalid={fieldState.invalid}
              className="h-12 w-20 text-center font-heading text-3xl font-bold tabular-nums md:text-3xl"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={`One more ${label.toLowerCase()}`}
              onClick={() => bump(1)}
            >
              <PlusIcon />
            </Button>
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

/** Live preview of how the records and reach read on the site. */
function Preview({ control }: { control: CoachControl }) {
  const values = useWatch({ control })
  const number = (text: string | undefined, fallback: number) =>
    parseNumberInput(text ?? "") ?? fallback
  const preview: CoachProfileData = {
    ...COACH_PROFILE_DEFAULTS,
    name: values.name || COACH_PROFILE_DEFAULTS.name,
    homeBase: values.homeBase || COACH_PROFILE_DEFAULTS.homeBase,
    worldRecords: number(values.worldRecords, 0),
    americanRecords: number(values.americanRecords, 0),
    stateRecords: number(values.stateRecords, 0),
    reach: parseReach(values.reach ?? ""),
  }

  return (
    <aside className="flex flex-col gap-3 xl:sticky xl:top-24">
      <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
        Live preview
      </p>
      <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-primary/30">
        <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          An elite powerlifting team
        </p>
        <dl className="grid grid-cols-3 gap-2">
          {coachRecords(preview).map((record) => (
            <div
              key={record.label}
              className="flex flex-col items-center gap-1.5 rounded-xl bg-background/60 px-2 py-3 text-center ring-1 ring-foreground/10"
            >
              <dt className="order-last text-[0.7rem] leading-snug text-muted-foreground">
                {record.label}
              </dt>
              <dd className="order-first font-heading text-3xl leading-none font-bold">
                {record.value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPinIcon className="mt-px size-3.5 shrink-0 text-highlight" aria-hidden="true" />
          {coachReachSentence(preview)}
        </p>
      </div>
    </aside>
  )
}
