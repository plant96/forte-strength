"use client"

import { InfoIcon, MinusIcon, PlusIcon } from "lucide-react"
import { Controller, useFormState, useWatch, type UseFormReturn } from "react-hook-form"

import { SELECT_TRIGGER_CLASS } from "@/components/forms/section-legend"
import { UnitInput } from "@/components/forms/unit-input"
import { parseNumberInput } from "@/lib/forms/reader"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import {
  clamp,
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
  roundTo,
  type HeightUnit,
  type WeightUnit,
} from "@/lib/units"

import type { BodyFieldsInput } from "../body-fields"
import {
  INPUT_LIMITS,
  SELECTABLE_INTENSITY_LEVELS,
  SEX_OPTIONS,
  STEP_OVERLAP_NOTE,
  type Sex,
  type TrainingIntensityId,
} from "../lib/constants"
import { BodyFatReferenceDialog } from "./body-fat-reference-dialog"
import { IntensityReferenceDialog } from "./intensity-reference-dialog"

// Any form whose values include the keys a field touches (calculators, onboarding, profile).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FormOf<T extends object> = UseFormReturn<T, any, any>

interface FieldProps<T extends object> {
  form: FormOf<T>
}

/** The keys each standalone field needs, so forms without the full body shape can reuse it. */
export type WeightFieldsInput = Pick<BodyFieldsInput, "weight" | "weightUnit">
export type SexFieldInput = Pick<BodyFieldsInput, "sex">
export interface AgeFieldInput {
  age: string
}

/** A field only touches its own keys (`Fields`), so any form that has them works. */
function useFieldsForm<Fields extends object, T extends Fields>(form: FormOf<T>) {
  const fieldsForm = form as unknown as UseFormReturn<Fields>
  const { isSubmitted } = useFormState({ control: fieldsForm.control })
  return { ...fieldsForm, isSubmitted }
}

/** The field components only touch the shared keys, so they work on the shared shape. */
function useBodyForm<T extends BodyFieldsInput>(form: FormOf<T>) {
  return useFieldsForm<BodyFieldsInput, T>(form)
}

export function WeightField<T extends WeightFieldsInput>({ form }: FieldProps<T>) {
  const { control, getValues, setValue, trigger, getFieldState, isSubmitted } = useFieldsForm<
    WeightFieldsInput,
    T
  >(form)
  const weightUnit = useWatch({ control, name: "weightUnit" })

  function changeUnit(next: WeightUnit) {
    if (next === getValues("weightUnit")) return
    const weight = parseNumberInput(getValues("weight"))
    if (weight !== null) {
      setValue("weight", String(roundTo(next === "kg" ? lbToKg(weight) : kgToLb(weight), 1)))
    }
    setValue("weightUnit", next, { shouldDirty: true })
    if (isSubmitted || getFieldState("weight").isTouched) void trigger("weight")
  }

  return (
    <Controller
      name="weight"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="weight">Bodyweight</FieldLabel>
          <div className="flex gap-2">
            <UnitInput
              {...field}
              id="weight"
              inputMode="decimal"
              placeholder={weightUnit === "kg" ? "82" : "180"}
              aria-invalid={fieldState.invalid}
              groupClassName="flex-1"
            />
            <Select value={weightUnit} onValueChange={(next) => changeUnit(next as WeightUnit)}>
              <SelectTrigger aria-label="Weight unit" className={`w-24 ${SELECT_TRIGGER_CLASS}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lb">lb</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function HeightField<T extends BodyFieldsInput>({ form }: FieldProps<T>) {
  const { control, getValues, setValue, trigger, clearErrors, isSubmitted } = useBodyForm(form)
  const heightUnit = useWatch({ control, name: "heightUnit" })
  const { errors } = useFormState({ control, name: ["heightFt", "heightIn", "heightCm"] })
  const heightErrors = heightUnit === "cm" ? [errors.heightCm] : [errors.heightFt, errors.heightIn]
  const invalid = heightErrors.some(Boolean)

  function changeUnit(next: HeightUnit) {
    if (next === getValues("heightUnit")) return
    if (next === "cm") {
      const ft = parseNumberInput(getValues("heightFt"))
      const inches = parseNumberInput(getValues("heightIn")) ?? 0
      if (ft !== null) setValue("heightCm", String(roundTo(ftInToCm(ft, inches), 1)))
      clearErrors(["heightFt", "heightIn"])
    } else {
      const cm = parseNumberInput(getValues("heightCm"))
      if (cm !== null) {
        const converted = cmToFtIn(cm)
        setValue("heightFt", String(converted.ft))
        setValue("heightIn", String(converted.in))
      }
      clearErrors("heightCm")
    }
    setValue("heightUnit", next, { shouldDirty: true })
    if (isSubmitted) void trigger(next === "cm" ? "heightCm" : ["heightFt", "heightIn"])
  }

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={heightUnit === "cm" ? "heightCm" : "heightFt"}>Height</FieldLabel>
      <div className="flex gap-2">
        {heightUnit === "cm" ? (
          <Controller
            name="heightCm"
            control={control}
            render={({ field, fieldState }) => (
              <UnitInput
                {...field}
                id="heightCm"
                inputMode="decimal"
                placeholder="178"
                suffix="cm"
                aria-invalid={fieldState.invalid}
                groupClassName="flex-1"
              />
            )}
          />
        ) : (
          <div className="grid flex-1 grid-cols-2 gap-2">
            <Controller
              name="heightFt"
              control={control}
              render={({ field, fieldState }) => (
                <UnitInput
                  {...field}
                  id="heightFt"
                  inputMode="numeric"
                  placeholder="5"
                  suffix="ft"
                  aria-invalid={fieldState.invalid}
                />
              )}
            />
            <Controller
              name="heightIn"
              control={control}
              render={({ field, fieldState }) => (
                <UnitInput
                  {...field}
                  id="heightIn"
                  inputMode="decimal"
                  placeholder="10"
                  suffix="in"
                  aria-label="Inches"
                  aria-invalid={fieldState.invalid}
                />
              )}
            />
          </div>
        )}
        <Select value={heightUnit} onValueChange={(next) => changeUnit(next as HeightUnit)}>
          <SelectTrigger aria-label="Height unit" className={`w-24 ${SELECT_TRIGGER_CLASS}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ft-in">ft / in</SelectItem>
            <SelectItem value="cm">cm</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <FieldError errors={heightErrors} />
    </Field>
  )
}

interface AgeFieldProps<T extends AgeFieldInput> extends FieldProps<T> {
  placeholder?: string
}

export function AgeField<T extends AgeFieldInput>({ form, placeholder = "30" }: AgeFieldProps<T>) {
  const { control } = useFieldsForm<AgeFieldInput, T>(form)

  return (
    <Controller
      name="age"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="age">Age</FieldLabel>
          <UnitInput
            {...field}
            id="age"
            inputMode="numeric"
            placeholder={placeholder}
            suffix="years"
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function SexField<T extends SexFieldInput>({ form }: FieldProps<T>) {
  const { control } = useFieldsForm<SexFieldInput, T>(form)

  return (
    <Controller
      name="sex"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel id="sex-label" asChild>
            <span>Sex</span>
          </FieldLabel>
          <ToggleGroup
            type="single"
            variant="outline"
            spacing={0}
            value={field.value}
            onValueChange={(next) => {
              if (next) field.onChange(next as Sex)
            }}
            aria-labelledby="sex-label"
            aria-invalid={fieldState.invalid}
            className="w-full"
          >
            {SEX_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.id}
                value={option.id}
                onBlur={field.onBlur}
                className="h-10 flex-1 data-[state=on]:border-primary/60 data-[state=on]:bg-primary/15 data-[state=on]:text-foreground"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function BodyFatField<T extends BodyFieldsInput>({ form }: FieldProps<T>) {
  const { control } = useBodyForm(form)

  return (
    <Controller
      name="bodyFat"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="bodyFat">Body fat</FieldLabel>
          <div className="flex gap-2">
            <UnitInput
              {...field}
              id="bodyFat"
              inputMode="decimal"
              placeholder="18"
              suffix="%"
              aria-invalid={fieldState.invalid}
              groupClassName="flex-1"
            />
            <BodyFatReferenceDialog />
          </div>
          <FieldDescription>Not sure? Compare yourself to the visual reference.</FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function StepsField<T extends BodyFieldsInput>({ form }: FieldProps<T>) {
  const { control } = useBodyForm(form)

  return (
    <Controller
      name="steps"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="steps">Average daily steps</FieldLabel>
          <UnitInput
            {...field}
            id="steps"
            inputMode="numeric"
            placeholder="8,000"
            suffix="steps"
            aria-invalid={fieldState.invalid}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function SessionsField<T extends BodyFieldsInput>({ form }: FieldProps<T>) {
  const { control, getValues, setValue, isSubmitted } = useBodyForm(form)

  function step(delta: number) {
    const current = parseNumberInput(getValues("sessions")) ?? 0
    const { min, max } = INPUT_LIMITS.sessions
    setValue("sessions", String(clamp(Math.round(current) + delta, min, max)), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: isSubmitted,
    })
  }

  return (
    <Controller
      name="sessions"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="sessions">Training sessions per week</FieldLabel>
          <InputGroup className="h-10">
            <InputGroupAddon align="inline-start">
              <InputGroupButton
                size="icon-xs"
                aria-label="One fewer session"
                onClick={() => step(-1)}
              >
                <MinusIcon />
              </InputGroupButton>
            </InputGroupAddon>
            <InputGroupInput
              {...field}
              id="sessions"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              placeholder="4"
              aria-invalid={fieldState.invalid}
              className="text-center tabular-nums placeholder:text-muted-foreground/45"
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                size="icon-xs"
                aria-label="One more session"
                onClick={() => step(1)}
              >
                <PlusIcon />
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

export function IntensityField<T extends BodyFieldsInput>({ form }: FieldProps<T>) {
  const { control } = useBodyForm(form)
  const [sessionsRaw, intensity] = useWatch({ control, name: ["sessions", "intensity"] })
  const noTraining = parseNumberInput(sessionsRaw) === 0
  const selected = SELECTABLE_INTENSITY_LEVELS.find((level) => level.id === intensity)

  return (
    <Controller
      name="intensity"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid} data-disabled={noTraining}>
          <FieldLabel htmlFor="intensity">Training intensity</FieldLabel>
          <div className="flex gap-2">
            <Select
              value={noTraining ? "" : field.value}
              onValueChange={(next) => field.onChange(next as TrainingIntensityId)}
              disabled={noTraining}
            >
              <SelectTrigger
                id="intensity"
                ref={field.ref}
                onBlur={field.onBlur}
                aria-invalid={fieldState.invalid}
                className={`min-w-0 flex-1 ${SELECT_TRIGGER_CLASS}`}
              >
                <SelectValue placeholder={noTraining ? "No training" : "Select intensity"} />
              </SelectTrigger>
              <SelectContent position="popper">
                {SELECTABLE_INTENSITY_LEVELS.map((level) => (
                  <SelectItem key={level.id} value={level.id}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <IntensityReferenceDialog
              selected={selected?.id ?? null}
              disabled={noTraining}
              onSelect={(id) => field.onChange(id)}
            />
          </div>
          <FieldDescription>
            {noTraining ? (
              "Set to “No training” because you train 0 sessions a week."
            ) : selected ? (
              <>
                <span className="font-medium text-foreground/85">{selected.label}:</span>{" "}
                {selected.description}
              </>
            ) : (
              "How hard a typical session feels. Not sure? Open the reference."
            )}
          </FieldDescription>
          <FieldError errors={[fieldState.error]} />
          {/* Applies whatever level is picked, so it's always visible. */}
          <p className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground ring-1 ring-foreground/5">
            <InfoIcon className="mt-0.5 size-3.5 shrink-0 text-highlight" aria-hidden="true" />
            {STEP_OVERLAP_NOTE}
          </p>
        </Field>
      )}
    />
  )
}
