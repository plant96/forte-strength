"use client"

import { CalculatorIcon } from "lucide-react"
import { Controller, type UseFormReturn } from "react-hook-form"

import { SectionLegend } from "@/components/forms/section-legend"
import { UnitInput } from "@/components/forms/unit-input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldSet,
} from "@/components/ui/field"

import type { TdeeFormInput, TdeeFormValues } from "../schema"
import {
  BodyFatField,
  HeightField,
  IntensityField,
  SessionsField,
  SexField,
  StepsField,
  WeightField,
} from "./body-fields"

interface TdeeFormProps {
  form: UseFormReturn<TdeeFormInput, unknown, TdeeFormValues>
  onCalculate: (values: TdeeFormValues) => void
  hasCalculated: boolean
}

export function TdeeForm({ form, onCalculate, hasCalculated }: TdeeFormProps) {
  return (
    <Card className="gap-0 py-0">
      <form onSubmit={form.handleSubmit(onCalculate)} noValidate className="flex flex-col">
        <div className="@container flex flex-col gap-8 p-5 sm:p-6">
          <FieldSet>
            <SectionLegend index="01">Your body</SectionLegend>
            <FieldGroup className="gap-5">
              <WeightField form={form} />
              <HeightField form={form} />
              <div className="grid gap-5 @md:grid-cols-2">
                <Controller
                  name="age"
                  control={form.control}
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
                <SexField form={form} />
              </div>
              <BodyFatField form={form} />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <SectionLegend index="02">Your activity</SectionLegend>
            <FieldGroup className="gap-5">
              <div className="grid gap-5 @md:grid-cols-2">
                <StepsField form={form} />
                <SessionsField form={form} />
              </div>
              <IntensityField form={form} />
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
