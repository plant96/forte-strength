"use client"

import { CalculatorIcon, InfoIcon, MinusIcon, PlusIcon } from "lucide-react"
import { Controller, useFormState, useWatch, type UseFormReturn } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"
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

import {
  INPUT_LIMITS,
  SELECTABLE_INTENSITY_LEVELS,
  SEX_OPTIONS,
  STEP_OVERLAP_NOTE,
  type Sex,
  type TrainingIntensityId,
} from "../lib/constants"
import { parseNumberInput, type TdeeFormInput, type TdeeFormValues } from "../schema"
import { BodyFatReferenceDialog } from "./body-fat-reference-dialog"
import { IntensityReferenceDialog } from "./intensity-reference-dialog"
import { UnitInput } from "./unit-input"

interface TdeeFormProps {
  form: UseFormReturn<TdeeFormInput, unknown, TdeeFormValues>
  onCalculate: (values: TdeeFormValues) => void
  hasCalculated: boolean
}

const SELECT_TRIGGER_CLASS = "data-[size=default]:h-10"

export function TdeeForm({ form, onCalculate, hasCalculated }: TdeeFormProps) {
  const { control, handleSubmit, getValues, setValue, trigger, clearErrors, getFieldState } = form
  const { isSubmitted } = useFormState({ control })
  const [weightUnit, heightUnit, sessionsRaw, intensity] = useWatch({
    control,
    name: ["weightUnit", "heightUnit", "sessions", "intensity"],
  })

  const noTraining = parseNumberInput(sessionsRaw) === 0
  const selectedIntensity = SELECTABLE_INTENSITY_LEVELS.find((level) => level.id === intensity)

  function changeWeightUnit(next: WeightUnit) {
    if (next === getValues("weightUnit")) return
    const weight = parseNumberInput(getValues("weight"))
    if (weight !== null) {
      setValue("weight", String(roundTo(next === "kg" ? lbToKg(weight) : kgToLb(weight), 1)))
    }
    setValue("weightUnit", next)
    if (isSubmitted || getFieldState("weight").isTouched) void trigger("weight")
  }

  function changeHeightUnit(next: HeightUnit) {
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
    setValue("heightUnit", next)
    if (isSubmitted) void trigger(next === "cm" ? "heightCm" : ["heightFt", "heightIn"])
  }

  function stepSessions(delta: number) {
    const current = parseNumberInput(getValues("sessions")) ?? 0
    const { min, max } = INPUT_LIMITS.sessions
    const next = clamp(Math.round(current) + delta, min, max)
    setValue("sessions", String(next), {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: isSubmitted,
    })
  }

  return (
    <Card className="gap-0 py-0">
      <form onSubmit={handleSubmit(onCalculate)} noValidate className="flex flex-col">
        <div className="@container flex flex-col gap-8 p-5 sm:p-6">
          <FieldSet>
            <SectionLegend index="01">Your body</SectionLegend>
            <FieldGroup className="gap-5">
              {/* Bodyweight */}
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
                      <Select
                        value={weightUnit}
                        onValueChange={(next) => changeWeightUnit(next as WeightUnit)}
                      >
                        <SelectTrigger
                          aria-label="Weight unit"
                          className={`w-24 ${SELECT_TRIGGER_CLASS}`}
                        >
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

              {/* Height */}
              <HeightField
                form={form}
                heightUnit={heightUnit}
                onHeightUnitChange={changeHeightUnit}
              />

              <div className="grid gap-5 @md:grid-cols-2">
                {/* Age */}
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
                        placeholder="30"
                        suffix="years"
                        aria-invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />

                {/* Sex */}
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
              </div>

              {/* Body fat */}
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
                    <FieldDescription>
                      Not sure? Compare yourself to the visual reference.
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <SectionLegend index="02">Your activity</SectionLegend>
            <FieldGroup className="gap-5">
              <div className="grid gap-5 @md:grid-cols-2">
                {/* Steps */}
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

                {/* Sessions */}
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
                            onClick={() => stepSessions(-1)}
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
                            onClick={() => stepSessions(1)}
                          >
                            <PlusIcon />
                          </InputGroupButton>
                        </InputGroupAddon>
                      </InputGroup>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              </div>

              {/* Intensity */}
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
                          <SelectValue
                            placeholder={noTraining ? "No training" : "Select intensity"}
                          />
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
                        selected={noTraining ? "none" : (selectedIntensity?.id ?? null)}
                      />
                    </div>
                    <FieldDescription>
                      {noTraining ? (
                        "Set to “No training” because you train 0 sessions a week."
                      ) : selectedIntensity ? (
                        <>
                          <span className="font-medium text-foreground/85">
                            {selectedIntensity.label}:
                          </span>{" "}
                          {selectedIntensity.description}
                        </>
                      ) : (
                        "How hard a typical session feels. Not sure? Open the reference."
                      )}
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                    {/* Applies whatever level is picked, so it's always visible. */}
                    <p className="flex items-start gap-2 rounded-lg bg-muted/30 px-3 py-2 text-xs leading-relaxed text-muted-foreground ring-1 ring-foreground/5">
                      <InfoIcon
                        className="mt-0.5 size-3.5 shrink-0 text-highlight"
                        aria-hidden="true"
                      />
                      {STEP_OVERLAP_NOTE}
                    </p>
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
        </div>

        <div className="flex flex-col gap-2 border-t border-border p-5 sm:p-6">
          <Button
            type="submit"
            size="lg"
            className="h-12 w-full font-heading text-base font-semibold tracking-wider uppercase"
          >
            <CalculatorIcon />
            Calculate TDEE
          </Button>
          {hasCalculated && (
            <p className="text-center text-xs text-muted-foreground">
              Results now update as you edit.
            </p>
          )}
        </div>
      </form>
    </Card>
  )
}

function SectionLegend({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <FieldLegend className="flex items-center gap-2 font-heading text-sm font-semibold tracking-[0.2em] uppercase">
      <span className="text-primary">{index}</span>
      {children}
    </FieldLegend>
  )
}

interface HeightFieldProps {
  form: UseFormReturn<TdeeFormInput, unknown, TdeeFormValues>
  heightUnit: HeightUnit
  onHeightUnitChange: (unit: HeightUnit) => void
}

function HeightField({ form, heightUnit, onHeightUnitChange }: HeightFieldProps) {
  const { control } = form
  const { errors } = useFormState({ control, name: ["heightFt", "heightIn", "heightCm"] })
  const heightErrors = heightUnit === "cm" ? [errors.heightCm] : [errors.heightFt, errors.heightIn]
  const invalid = heightErrors.some(Boolean)

  const unitSelect = (
    <Select value={heightUnit} onValueChange={(next) => onHeightUnitChange(next as HeightUnit)}>
      <SelectTrigger aria-label="Height unit" className={`w-24 ${SELECT_TRIGGER_CLASS}`}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="ft-in">ft / in</SelectItem>
        <SelectItem value="cm">cm</SelectItem>
      </SelectContent>
    </Select>
  )

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
        {unitSelect}
      </div>
      <FieldError errors={heightErrors} />
    </Field>
  )
}
