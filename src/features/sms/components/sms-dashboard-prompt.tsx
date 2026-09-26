"use client"

import {
  BellRingIcon,
  CalendarCheckIcon,
  CalendarClockIcon,
  MessageSquareTextIcon,
  UserRoundCheckIcon,
} from "lucide-react"
import { m } from "motion/react"
import { useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { enter } from "@/features/dashboard/components/variants"

import { snoozeSmsPrompt } from "../actions"
import type { SmsState } from "../queries"
import { SmsConsentForm } from "./sms-consent-form"

/** Let the dashboard land before the prompt asks for anything. */
const PROMPT_DELAY_MS = 900

const TOPICS = [
  { icon: CalendarCheckIcon, label: "Training sessions" },
  { icon: CalendarClockIcon, label: "Schedule changes" },
  { icon: UserRoundCheckIcon, label: "Account updates" },
]

/**
 * The dashboard's push for text updates: a card that stays until they opt in, and a
 * dialog that opens by itself when it's due (first visit, then again a week after each
 * "Not now"). Closing the dialog any way counts as "Not now". Nothing here pre-ticks the
 * consent box or makes the dashboard wait on an answer — carriers reject opt-ins that do.
 */
export function SmsDashboardPrompt({ state }: { state: SmsState }) {
  const [open, setOpen] = useState(false)
  const [optedIn, setOptedIn] = useState(false)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!state.promptDue || state.optedIn) return
    const timer = setTimeout(() => setOpen(true), PROMPT_DELAY_MS)
    return () => clearTimeout(timer)
  }, [state.promptDue, state.optedIn])

  if (state.optedIn || optedIn) return null

  function notNow() {
    setOpen(false)
    void snoozeSmsPrompt()
  }

  return (
    <>
      <m.section
        variants={enter}
        aria-labelledby="sms-card-heading"
        className="relative flex flex-col gap-4 overflow-hidden rounded-2xl bg-card p-5 ring-1 ring-primary/35 sm:flex-row sm:items-center sm:gap-5 sm:px-6"
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -left-12 size-48 rounded-full bg-primary/15 blur-3xl"
        />
        <span className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-highlight ring-1 ring-primary/30">
          <MessageSquareTextIcon className="size-6" />
          <span className="absolute -top-1 -right-1 flex size-3">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
            <span className="relative inline-flex size-3 rounded-full bg-primary" />
          </span>
        </span>
        <div className="relative flex min-w-0 flex-1 flex-col gap-1">
          <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
            Text updates
          </p>
          <h2 id="sms-card-heading" className="font-heading text-xl font-bold uppercase">
            Get training updates by text
          </h2>
          <p className="text-sm text-muted-foreground">
            Hear about your training sessions, schedule changes and account updates the moment they
            happen.
          </p>
        </div>
        <Button
          size="lg"
          onClick={() => setOpen(true)}
          className="relative h-11 shrink-0 px-5 font-heading tracking-wider uppercase"
        >
          <BellRingIcon />
          Turn on texts
        </Button>
      </m.section>

      <Dialog open={open} onOpenChange={(next) => (next ? setOpen(true) : notNow())}>
        <DialogContent
          ref={contentRef}
          // Focus the dialog, not the phone field: on a phone that would throw the keyboard
          // up before they've read a word.
          onOpenAutoFocus={(event) => {
            event.preventDefault()
            contentRef.current?.focus()
          }}
          className="gap-5 p-5 sm:max-w-lg sm:p-6"
        >
          <DialogHeader className="gap-3">
            <span className="grid size-12 place-items-center rounded-xl bg-primary/15 text-highlight ring-1 ring-primary/30">
              <MessageSquareTextIcon className="size-6" />
            </span>
            <div className="flex flex-col gap-1.5">
              <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
                Stay in the loop
              </p>
              <DialogTitle className="font-heading text-2xl font-bold uppercase">
                Get training updates by text
              </DialogTitle>
              <DialogDescription>
                Your coach can reach you the moment something changes, without it getting lost in
                your inbox.
              </DialogDescription>
            </div>
            <ul className="flex flex-wrap gap-2">
              {TOPICS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="inline-flex items-center gap-1.5 rounded-full bg-muted/60 px-2.5 py-1 text-xs font-medium ring-1 ring-foreground/10"
                >
                  <Icon className="size-3.5 text-highlight" aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </DialogHeader>

          <SmsConsentForm
            id="sms-prompt"
            source="dashboard"
            defaultPhone={state.prefillPhone}
            onOptedIn={() => {
              setOptedIn(true)
              setOpen(false)
            }}
            secondaryAction={
              <Button type="button" variant="ghost" size="lg" className="h-11" onClick={notNow}>
                Not now
              </Button>
            }
          />
          <p className="-mt-2 text-center text-xs text-muted-foreground sm:text-right">
            You can turn texts on or off any time in Settings.
          </p>
        </DialogContent>
      </Dialog>
    </>
  )
}
