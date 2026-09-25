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
import { AgeField, SexField, WeightField } from "@/features/tdee/components/body-fields"

import type { DotsFormInput, DotsFormValues } from "../schema"
import { TotalField } from "./total-field"

interface DotsFormProps {
  form: UseFormReturn<DotsFormInput, unknown, DotsFormValues>
  onCalculate: (values: DotsFormValues) => void
  hasCalculated: boolean
  accountState: AccountState
}

export function DotsForm({ form, onCalculate, hasCalculated, accountState }: DotsFormProps) {
  return (
    <Card className="gap-0 py-0">
      <form onSubmit={form.handleSubmit(onCalculate)} noValidate className="flex flex-col">
        <div className="@container flex flex-col gap-8 p-5 sm:p-6">
          <FieldSet aria-labelledby="dots-body-heading">
            <SectionLegendRow
              id="dots-body-heading"
              index="01"
              aside={<AccountNudge state={accountState} />}
            >
              Your body
            </SectionLegendRow>
            <FieldGroup className="gap-5">
              <WeightField form={form} />
              <div className="grid gap-5 @md:grid-cols-2">
                <AgeField form={form} placeholder="28" />
                <SexField form={form} />
              </div>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <SectionLegend index="02">Your total</SectionLegend>
            <FieldGroup className="gap-5">
              <TotalField form={form} />
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
              Calculate scores
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
