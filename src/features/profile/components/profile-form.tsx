"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2Icon, SaveIcon } from "lucide-react"
import { useTransition } from "react"
import { useForm, useFormState, type FieldPath } from "react-hook-form"
import { toast } from "sonner"

import { SectionLegend } from "@/components/forms/section-legend"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FieldGroup, FieldSeparator, FieldSet } from "@/components/ui/field"
import {
  BodyFatField,
  HeightField,
  IntensityField,
  SessionsField,
  SexField,
  StepsField,
  WeightField,
} from "@/features/tdee/components/body-fields"

import { saveProfile } from "../actions"
import {
  PROFILE_FORM_DEFAULTS,
  profileFormSchema,
  type ProfileFormInput,
  type ProfileFormValues,
} from "../schema"
import { BirthdayField } from "./birthday-field"

export function ProfileForm({ initialValues }: { initialValues: ProfileFormInput | null }) {
  const form = useForm<ProfileFormInput, unknown, ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: initialValues ?? PROFILE_FORM_DEFAULTS,
    mode: "onTouched",
  })
  const { isDirty } = useFormState({ control: form.control })
  const [isSaving, startSaving] = useTransition()

  const onSubmit = form.handleSubmit(() => {
    startSaving(async () => {
      const values = form.getValues()
      const result = await saveProfile(values)
      if (result.ok) {
        form.reset(values)
        toast.success("Profile saved", {
          description: "Your tools will use these numbers from now on.",
        })
        return
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as FieldPath<ProfileFormInput>, { message })
      }
      toast.error(result.message)
    })
  })

  return (
    <Card className="gap-0 py-0">
      <form onSubmit={onSubmit} noValidate className="flex flex-col">
        <div className="@container flex flex-col gap-8 p-5 sm:p-6">
          <FieldSet>
            <SectionLegend index="01">About you</SectionLegend>
            <FieldGroup className="gap-5">
              <div className="grid gap-5 @lg:grid-cols-2">
                <BirthdayField form={form} />
                <SexField form={form} />
              </div>
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <SectionLegend index="02">Your body</SectionLegend>
            <FieldGroup className="gap-5">
              <div className="grid gap-5 @lg:grid-cols-2">
                <WeightField form={form} />
                <HeightField form={form} />
              </div>
              <BodyFatField form={form} />
            </FieldGroup>
          </FieldSet>

          <FieldSeparator />

          <FieldSet>
            <SectionLegend index="03">Your activity</SectionLegend>
            <FieldGroup className="gap-5">
              <div className="grid gap-5 @md:grid-cols-2">
                <StepsField form={form} />
                <SessionsField form={form} />
              </div>
              <IntensityField form={form} />
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
            disabled={isSaving || (!isDirty && initialValues !== null)}
            className="h-11 min-w-40 font-heading text-base font-semibold tracking-wider uppercase"
          >
            {isSaving ? <Loader2Icon className="animate-spin" /> : <SaveIcon />}
            {isSaving ? "Saving" : "Save profile"}
          </Button>
        </div>
      </form>
    </Card>
  )
}
