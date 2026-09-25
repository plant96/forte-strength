"use client"

import { CalculatorIcon } from "lucide-react"
import { m } from "motion/react"
import type { UseFormReturn } from "react-hook-form"

import { AccountNudge, type AccountState } from "@/components/account/account-nudge"
import { SectionLegend, SectionLegendRow } from "@/components/forms/section-legend"
import { spring } from "@/components/motion/variants"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field"

import type { TdeeFormInput, TdeeFormValues } from "../schema"
import {
  AgeField,
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
  accountState: AccountState
}

export function TdeeForm({ form, onCalculate, hasCalculated, accountState }: TdeeFormProps) {
  return (
    <Card className="gap-0 py-0">
      <form onSubmit={form.handleSubmit(onCalculate)} noValidate className="flex flex-col">
        <div className="@container flex flex-col gap-8 p-5 sm:p-6">
          <FieldSet aria-labelledby="tdee-body-heading">
            <SectionLegendRow
              id="tdee-body-heading"
              index="01"
              aside={<AccountNudge state={accountState} />}
            >
              Your body
            </SectionLegendRow>
            <FieldGroup className="gap-5">
              <WeightField form={form} />
              <HeightField form={form} />
              <div className="grid gap-5 @md:grid-cols-2">
                <AgeField form={form} />
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
          <m.div whileTap={{ scale: 0.985 }} transition={spring}>
            <Button
              type="submit"
              size="lg"
              className="h-12 w-full font-heading text-base font-semibold tracking-wider uppercase"
            >
              <CalculatorIcon />
              Calculate TDEE
            </Button>
          </m.div>
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
