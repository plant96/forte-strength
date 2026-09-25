"use client"

import { Controller, useFormState, useWatch, type UseFormReturn } from "react-hook-form"

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
import { parseNumberInput } from "@/lib/forms/reader"
import { kgToLb, lbToKg, roundTo, type WeightUnit } from "@/lib/units"

export interface TotalFieldsInput {
  total: string
  totalUnit: WeightUnit
}

interface TotalFieldProps<T extends TotalFieldsInput> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<T, any, any>
}

/** The competition total with its own lb/kg switch, mirroring the bodyweight field. */
export function TotalField<T extends TotalFieldsInput>({ form }: TotalFieldProps<T>) {
  const { control, getValues, setValue, trigger, getFieldState } =
    form as unknown as UseFormReturn<TotalFieldsInput>
  const { isSubmitted } = useFormState({ control })
  const totalUnit = useWatch({ control, name: "totalUnit" })

  function changeUnit(next: WeightUnit) {
    if (next === getValues("totalUnit")) return
    const total = parseNumberInput(getValues("total"))
    if (total !== null) {
      setValue("total", String(roundTo(next === "kg" ? lbToKg(total) : kgToLb(total), 1)))
    }
    setValue("totalUnit", next, { shouldDirty: true })
    if (isSubmitted || getFieldState("total").isTouched) void trigger("total")
  }

  return (
    <Controller
      name="total"
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor="total">Total</FieldLabel>
          <div className="flex gap-2">
            <UnitInput
              {...field}
              id="total"
              inputMode="decimal"
              placeholder={totalUnit === "kg" ? "600" : "1,320"}
              aria-invalid={fieldState.invalid}
              groupClassName="flex-1"
            />
            <Select value={totalUnit} onValueChange={(next) => changeUnit(next as WeightUnit)}>
              <SelectTrigger aria-label="Total unit" className={`w-24 ${SELECT_TRIGGER_CLASS}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lb">lb</SelectItem>
                <SelectItem value="kg">kg</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <FieldDescription>
            Your best squat, bench press and deadlift added together.
          </FieldDescription>
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
