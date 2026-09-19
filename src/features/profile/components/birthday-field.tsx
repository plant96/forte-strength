"use client"

import { Controller, useFormState, type UseFormReturn } from "react-hook-form"

import { SELECT_TRIGGER_CLASS } from "@/components/forms/section-legend"
import { UnitInput } from "@/components/forms/unit-input"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { MONTHS } from "../lib/birthday"
import type { ProfileFormInput, ProfileFormValues } from "../schema"

export function BirthdayField({
  form,
}: {
  form: UseFormReturn<ProfileFormInput, unknown, ProfileFormValues>
}) {
  const { control } = form
  const { errors } = useFormState({ control, name: ["birthMonth", "birthDay", "birthYear"] })
  const fieldErrors = [errors.birthMonth, errors.birthDay, errors.birthYear]
  const invalid = fieldErrors.some(Boolean)

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor="birthMonth">Birthday</FieldLabel>
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)] gap-2">
        <Controller
          name="birthMonth"
          control={control}
          render={({ field, fieldState }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id="birthMonth"
                ref={field.ref}
                onBlur={field.onBlur}
                aria-label="Birth month"
                aria-invalid={fieldState.invalid}
                className={`w-full ${SELECT_TRIGGER_CLASS}`}
              >
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent position="popper">
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={String(index + 1)}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        />
        <Controller
          name="birthDay"
          control={control}
          render={({ field, fieldState }) => (
            <UnitInput
              {...field}
              id="birthDay"
              inputMode="numeric"
              placeholder="Day"
              aria-label="Birth day"
              aria-invalid={fieldState.invalid}
              maxLength={2}
            />
          )}
        />
        <Controller
          name="birthYear"
          control={control}
          render={({ field, fieldState }) => (
            <UnitInput
              {...field}
              id="birthYear"
              inputMode="numeric"
              placeholder="Year"
              aria-label="Birth year"
              aria-invalid={fieldState.invalid}
              maxLength={4}
            />
          )}
        />
      </div>
      <FieldDescription>Used to keep your age up to date automatically.</FieldDescription>
      <FieldError errors={fieldErrors} />
    </Field>
  )
}
