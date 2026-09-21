"use client"

import { CalendarIcon } from "lucide-react"
import { useState } from "react"
import { Controller, useFormState, type UseFormReturn } from "react-hook-form"

import { Calendar } from "@/components/forms/calendar"
import { SELECT_TRIGGER_CLASS } from "@/components/forms/section-legend"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { UnitInput } from "@/components/forms/unit-input"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { INPUT_LIMITS } from "@/features/tdee/lib/constants"
import { addMonths, dayParts, makeDay, today, type Day } from "@/lib/day"

import { MONTHS } from "../lib/birthday"
import type { ProfileFormInput, ProfileFormValues } from "../schema"

export function BirthdayField({
  form,
}: {
  form: UseFormReturn<ProfileFormInput, unknown, ProfileFormValues>
}) {
  const { control, setValue, watch } = form
  const { errors } = useFormState({ control, name: ["birthMonth", "birthDay", "birthYear"] })
  const fieldErrors = [errors.birthMonth, errors.birthDay, errors.birthYear]
  const invalid = fieldErrors.some(Boolean)
  const [pickerOpen, setPickerOpen] = useState(false)

  // The calendar only offers birthdays the calculators actually accept, so a date picked
  // here can never fail the age check the way a typed one can.
  const oldest = addMonths(today(), -INPUT_LIMITS.age.max * 12)
  const youngest = addMonths(today(), -INPUT_LIMITS.age.min * 12)
  const picked = makeDay(
    Number(watch("birthYear")),
    Number(watch("birthMonth")),
    Number(watch("birthDay")),
  )

  function choose(day: Day) {
    const parts = dayParts(day)
    if (!parts) return
    const options = { shouldDirty: true, shouldValidate: true } as const
    setValue("birthMonth", String(parts.month), options)
    setValue("birthDay", String(parts.dayOfMonth), options)
    setValue("birthYear", String(parts.year), options)
    setPickerOpen(false)
  }

  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor="birthMonth">Birthday</FieldLabel>
      <div className="grid grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)_minmax(0,1fr)_auto] gap-2">
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
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger
            type="button"
            aria-label="Pick your birthday from a calendar"
            className="grid size-10 shrink-0 place-items-center rounded-lg border border-input text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
          >
            <CalendarIcon className="size-4" />
          </PopoverTrigger>
          <PopoverContent align="end">
            <Calendar value={picked} min={oldest} max={youngest} onSelect={choose} />
          </PopoverContent>
        </Popover>
      </div>
      <FieldDescription>Used to keep your age up to date automatically.</FieldDescription>
      <FieldError errors={fieldErrors} />
    </Field>
  )
}
