"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { cn } from "cn"
import { Loader2Icon, MessageSquareTextIcon } from "lucide-react"
import Link from "next/link"
import { useTransition } from "react"
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

import { optInToSms } from "../actions"
import { SMS_CONSENT_TEXT } from "../consent"
import { smsOptInSchema, type SmsOptInInput, type SmsSource } from "../schema"

interface SmsConsentFormProps {
  /** Unique on the page: it namespaces the input ids. */
  id: string
  source: SmsSource
  defaultPhone?: string
  /**
   * Every part visible, nothing usable — for visitors who can't opt in (the public /sms
   * page, which is also what carriers review). `previewAction` replaces the submit button.
   */
  preview?: boolean
  previewAction?: React.ReactNode
  onOptedIn?: () => void
  /** Beside the submit button, e.g. "Not now". */
  secondaryAction?: React.ReactNode
  className?: string
}

/**
 * The text-updates opt-in, exactly as carriers require it: the number, an unticked box
 * beside the full disclosure, links to the Terms and Privacy Policy, and nothing sent
 * until the box is ticked. The wording comes from `consent.ts` and is stored with each
 * opt-in, so every surface asks the same question in the same words.
 */
export function SmsConsentForm({
  id,
  source,
  defaultPhone = "",
  preview = false,
  previewAction,
  onOptedIn,
  secondaryAction,
  className,
}: SmsConsentFormProps) {
  const form = useForm<SmsOptInInput>({
    resolver: zodResolver(smsOptInSchema),
    defaultValues: { phone: defaultPhone, consent: false },
    mode: "onTouched",
  })
  const agreed = useWatch({ control: form.control, name: "consent" })
  const [pending, startSaving] = useTransition()

  const onSubmit = form.handleSubmit((values) => {
    if (preview) return
    startSaving(async () => {
      const result = await optInToSms(values, source)
      if (result.ok) {
        toast.success("Text updates are on", {
          description: "Reply STOP to any message to cancel.",
        })
        onOptedIn?.()
        return
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as FieldPath<SmsOptInInput>, { message })
      }
      toast.error(result.message)
    })
  })

  return (
    <form id={id} noValidate onSubmit={onSubmit} className={cn("flex flex-col gap-4", className)}>
      <Controller
        name="phone"
        control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${id}-phone`}>Mobile phone number</FieldLabel>
            <Input
              {...field}
              id={`${id}-phone`}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="(555) 555-0123"
              disabled={preview}
              aria-invalid={fieldState.invalid}
              className="h-11 text-base"
            />
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />

      <Controller
        name="consent"
        control={form.control}
        render={({ field, fieldState }) => (
          <div
            className={cn(
              "flex flex-col gap-2 rounded-xl bg-muted/40 p-3.5 ring-1 ring-foreground/10 transition-colors",
              field.value && "bg-primary/5 ring-primary/40",
              fieldState.invalid && "ring-destructive/60",
            )}
          >
            <label
              htmlFor={`${id}-consent`}
              className={cn(
                "flex gap-3 text-sm leading-relaxed text-foreground/85",
                preview ? "cursor-default" : "cursor-pointer",
              )}
            >
              <Checkbox
                id={`${id}-consent`}
                name={field.name}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                onBlur={field.onBlur}
                disabled={preview}
                aria-invalid={fieldState.invalid}
                className="mt-0.5 size-5"
              />
              <span>{SMS_CONSENT_TEXT}</span>
            </label>
            <p className="pl-8 text-xs text-muted-foreground">
              <Link
                href="/terms"
                target="_blank"
                className="text-highlight underline-offset-4 hover:underline"
              >
                Terms of Service
              </Link>
              <span aria-hidden="true" className="px-2">
                |
              </span>
              <Link
                href="/privacy"
                target="_blank"
                className="text-highlight underline-offset-4 hover:underline"
              >
                Privacy Policy
              </Link>
            </p>
            <FieldError errors={[fieldState.error]} className="pl-8" />
          </div>
        )}
      />

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end">
        {secondaryAction}
        {preview ? (
          previewAction
        ) : (
          <Button
            type="submit"
            size="lg"
            disabled={pending || !agreed}
            className="h-11 px-5 font-heading tracking-wider uppercase"
          >
            {pending ? <Loader2Icon className="animate-spin" /> : <MessageSquareTextIcon />}
            Yes, text me updates
          </Button>
        )}
      </div>
    </form>
  )
}
