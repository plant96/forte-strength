"use client"

import { cn } from "cn"
import { Controller, type Control } from "react-hook-form"

import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

import type { ApplicationFormInput, ApplicationValues } from "../schema"

type TextFieldName = {
  [K in keyof ApplicationFormInput]: ApplicationFormInput[K] extends string ? K : never
}[keyof ApplicationFormInput]

interface TextFieldProps extends Omit<React.ComponentProps<"input">, "name"> {
  control: Control<ApplicationFormInput, unknown, ApplicationValues>
  name: TextFieldName
  label: string
  hint?: string
}

export function TextField({
  control,
  name,
  label,
  hint,
  className,
  ...inputProps
}: TextFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name}>{label}</FieldLabel>
          {hint && <FieldDescription className="-mt-1">{hint}</FieldDescription>}
          <Input
            {...inputProps}
            {...field}
            id={name}
            aria-invalid={fieldState.invalid}
            className={cn("h-10 placeholder:text-muted-foreground/45", className)}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}

interface LongTextFieldProps {
  control: Control<ApplicationFormInput, unknown, ApplicationValues>
  name: TextFieldName
  label: string
  hint?: string
  placeholder?: string
  size?: "md" | "lg"
}

export function LongTextField({
  control,
  name,
  label,
  hint,
  placeholder,
  size = "md",
}: LongTextFieldProps) {
  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={name} className="leading-snug">
            {label}
          </FieldLabel>
          {hint && <FieldDescription className="-mt-1">{hint}</FieldDescription>}
          <Textarea
            {...field}
            id={name}
            placeholder={placeholder}
            aria-invalid={fieldState.invalid}
            className={cn(
              "text-sm leading-relaxed placeholder:text-muted-foreground/45",
              size === "lg" ? "min-h-40" : "min-h-24",
            )}
          />
          <FieldError errors={[fieldState.error]} />
        </Field>
      )}
    />
  )
}
