"use client"

import { useEffect } from "react"
import { useWatch, type UseFormReturn } from "react-hook-form"

import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { WeightUnit } from "@/lib/units"

import type { ProfileFormInput } from "../schema"

/**
 * Which unit gym weights are read in — plates, dumbbells, machines.
 *
 * Kept separate from the bodyweight unit on purpose: plenty of lifters weigh in for a kg
 * weight class but load the bar in pounds, and forcing one choice on both would quietly
 * get one of them wrong. Until it is touched it mirrors the bodyweight unit, which is the
 * right guess for everyone else.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
type ProfileFormLike = UseFormReturn<ProfileFormInput, any, any>

export function LiftUnitField({ form }: { form: ProfileFormLike }) {
  const { control, setValue, getFieldState } = form
  const liftUnit = useWatch({ control, name: "liftUnit" })
  const weightUnit = useWatch({ control, name: "weightUnit" })

  useEffect(() => {
    if (getFieldState("liftUnit").isDirty) return
    if (weightUnit !== liftUnit) setValue("liftUnit", weightUnit)
  }, [weightUnit, liftUnit, getFieldState, setValue])

  return (
    <Field>
      <FieldLabel htmlFor="liftUnit">Gym weights</FieldLabel>
      <ToggleGroup
        type="single"
        id="liftUnit"
        value={liftUnit}
        onValueChange={(next) =>
          next && setValue("liftUnit", next as WeightUnit, { shouldDirty: true })
        }
        className="w-fit"
      >
        <ToggleGroupItem value="lb" className="px-6">
          Pounds
        </ToggleGroupItem>
        <ToggleGroupItem value="kg" className="px-6">
          Kilos
        </ToggleGroupItem>
      </ToggleGroup>
      <FieldDescription>
        How you read plates, dumbbells and machines when you log a PR. Separate from your bodyweight
        unit — plenty of lifters compete in kilos but train in pounds.
      </FieldDescription>
    </Field>
  )
}
