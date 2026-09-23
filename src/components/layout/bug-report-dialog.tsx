"use client"

import { useAuth } from "@clerk/nextjs"
import { zodResolver } from "@hookform/resolvers/zod"
import { BugIcon, Loader2Icon, SendIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import { useState, useTransition } from "react"
import { Controller, useForm, type FieldPath } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { submitBugReport } from "@/features/bug-reports/actions"
import {
  BUG_DESCRIPTION_MAX,
  BUG_REPORT_DEFAULTS,
  bugReportSchema,
  type BugReportFormInput,
  type BugReportValues,
} from "@/features/bug-reports/schema"

/** The footer's "Report a bug": a short form that files straight into the admin panel. */
export function BugReportDialog() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const [pending, startSending] = useTransition()
  const form = useForm<BugReportFormInput, unknown, BugReportValues>({
    resolver: zodResolver(bugReportSchema),
    defaultValues: BUG_REPORT_DEFAULTS,
    mode: "onTouched",
  })

  function handleOpenChange(next: boolean) {
    setOpen(next)
    // The page is captured when the dialog opens, so it names the page they were on.
    if (next) form.reset({ ...BUG_REPORT_DEFAULTS, path: pathname })
  }

  const onSubmit = form.handleSubmit(() => {
    startSending(async () => {
      const result = await submitBugReport(form.getValues())
      if (result.ok) {
        toast.success("Thanks — we'll take a look", {
          description: "Your report is with the coach.",
        })
        setOpen(false)
        form.reset(BUG_REPORT_DEFAULTS)
        return
      }
      for (const [field, message] of Object.entries(result.fieldErrors ?? {})) {
        form.setError(field as FieldPath<BugReportFormInput>, { message })
      }
      toast.error(result.message)
    })
  })

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 underline-offset-4 hover:text-foreground hover:underline"
        >
          <BugIcon className="size-3.5" aria-hidden="true" />
          Report a bug
        </button>
      </DialogTrigger>
      <DialogContent className="gap-5 p-5 sm:max-w-md sm:p-6">
        <DialogHeader className="gap-1.5 pr-8">
          <DialogTitle className="font-heading text-2xl font-bold uppercase">
            Report a bug
          </DialogTitle>
          <DialogDescription>
            Tell us what went wrong and what you expected. We read every one.
          </DialogDescription>
        </DialogHeader>

        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-5">
          <Controller
            name="description"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="bug-description">What happened?</FieldLabel>
                <Textarea
                  {...field}
                  id="bug-description"
                  rows={5}
                  maxLength={BUG_DESCRIPTION_MAX}
                  placeholder="The chart on the PR tracker is blank on my phone after I add a record…"
                  aria-invalid={fieldState.invalid}
                  className="min-h-28"
                />
                <FieldDescription>
                  Reporting from <span className="font-mono text-xs">{pathname}</span>.
                </FieldDescription>
                <FieldError errors={[fieldState.error]} />
              </Field>
            )}
          />

          {!isSignedIn && (
            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="bug-email">
                    Email <span className="font-normal text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id="bug-email"
                    type="email"
                    autoComplete="email"
                    placeholder="you@example.com"
                    aria-invalid={fieldState.invalid}
                    className="h-10"
                  />
                  <FieldDescription>Only if you&apos;d like a reply.</FieldDescription>
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          )}

          {/* Honeypot: invisible to people, irresistible to bots. */}
          <div
            aria-hidden="true"
            className="absolute top-0 -left-[9999px] h-px w-px overflow-hidden"
          >
            <label htmlFor="bug-website">Website</label>
            <input
              {...form.register("website")}
              id="bug-website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <DialogFooter className="-mx-5 -mb-5 px-5 sm:-mx-6 sm:-mb-6 sm:px-6">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="h-10" disabled={pending}>
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              disabled={pending}
              className="h-10 font-heading tracking-wider uppercase"
            >
              {pending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
              Send report
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
