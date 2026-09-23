"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "cn"
import { useTransition } from "react"
import { Controller, useForm, type FieldPath } from "react-hook-form"
import { toast } from "sonner"

import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { saveName } from "../actions"
import { nameSchema, type NameFormInput } from "../schema"

interface NameFormProps {
  /** Unique on the page: it namespaces the input ids and lets a footer target the form. */
  id: string
  initialValues: NameFormInput
  onSaved: (values: NameFormInput) => void
  /** Rendered inside the form so a submit button can read the pending state. */
  footer: (state: { pending: boolean }) => React.ReactNode
  className?: string
  /** Wraps the two inputs — padding, when the footer needs to sit flush against an edge. */
  fieldsClassName?: string
}

/**
 * First and last name, saved on submit. A standalone `<form>` so it can sit inside the
 * onboarding card (whose other steps share one form) or inside a dialog.
 */
export function NameForm({
  id,
  initialValues,
  onSaved,
  footer,
  className,
  fieldsClassName,
}: NameFormProps) {
  const form = useForm<NameFormInput, unknown, NameFormInput>({
    resolver: zodResolver(nameSchema),
    defaultValues: initialValues,
    mode: "onTouched",
  })
  const [pending, startSaving] = useTransition()

  const onSubmit = form.handleSubmit((values) => {
    startSaving(async () => {
      const result = await saveName(values)
      if (result.ok) {
        onSaved(values)
        return
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as FieldPath<NameFormInput>, { message })
      }
      toast.error(result.message)
    })
  })

  return (
    <form id={id} noValidate onSubmit={onSubmit} className={cn("flex flex-col gap-5", className)}>
      <div className={cn("@container", fieldsClassName)}>
        <div className="grid gap-5 @md:grid-cols-2">
          <Controller
            name="firstName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-first-name`}>First name</FieldLabel>
                <Input
                  {...field}
                  id={`${id}-first-name`}
                  autoComplete="given-name"
                  placeholder="Jordan"
                  aria-invalid={fieldState.invalid}
                  className="h-10"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
          <Controller
            name="lastName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={`${id}-last-name`}>Last name</FieldLabel>
                <Input
                  {...field}
                  id={`${id}-last-name`}
                  autoComplete="family-name"
                  placeholder="Lee"
                  aria-invalid={fieldState.invalid}
                  className="h-10"
                />
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />
        </div>
      </div>
      {footer({ pending })}
    </form>
  )
}
