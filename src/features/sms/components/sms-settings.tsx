"use client"

import { cn } from "cn"
import { BellOffIcon, Loader2Icon, MessageSquareTextIcon, PencilIcon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

import { optOutOfSms } from "../actions"
import { SMS_SETTINGS_ANCHOR } from "../consent"
import type { SmsState } from "../queries"
import { SmsConsentForm } from "./sms-consent-form"

/**
 * Text updates in Settings: on, with the number and a way to change it or stop; or off,
 * with the same opt-in form the dashboard uses. `canOptIn` is false for an account that is
 * no longer a client — it can still turn texts off, just not back on.
 */
export function SmsSettings({ state, canOptIn }: { state: SmsState; canOptIn: boolean }) {
  const [changing, setChanging] = useState(false)
  const [pending, startStopping] = useTransition()

  function turnOff() {
    startStopping(async () => {
      const result = await optOutOfSms("settings")
      if (result.ok) toast.success("Text updates are off")
      else toast.error(result.message)
    })
  }

  return (
    <section
      id={SMS_SETTINGS_ANCHOR}
      aria-labelledby="sms-settings-heading"
      className={cn(
        "flex scroll-mt-24 flex-col gap-5 rounded-2xl bg-card p-5 ring-1 sm:p-6",
        state.optedIn ? "ring-foreground/10" : "ring-primary/35",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-highlight">
          <MessageSquareTextIcon className="size-5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 id="sms-settings-heading" className="font-heading text-xl font-bold uppercase">
              Text updates
            </h2>
            <span
              className={cn(
                "rounded-full px-2 py-0.5 text-xs font-semibold",
                state.optedIn
                  ? "bg-primary/15 text-highlight ring-1 ring-primary/30"
                  : "bg-muted text-muted-foreground",
              )}
            >
              {state.optedIn ? "On" : "Off"}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Texts from your coach about your training sessions, schedule changes and account
            updates.
          </p>
        </div>
      </div>

      {state.optedIn && !changing ? (
        <div className="flex flex-col gap-4">
          <p className="text-sm">
            Texts go to <span className="font-medium tabular-nums">{state.phone}</span>
            {state.optedInOn && (
              <span className="text-muted-foreground">, on since {state.optedInOn}</span>
            )}
            .
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {canOptIn && (
              <Button variant="outline" className="h-10" onClick={() => setChanging(true)}>
                <PencilIcon />
                Use a different number
              </Button>
            )}
            <Button
              variant="ghost"
              className="h-10 text-muted-foreground"
              disabled={pending}
              onClick={turnOff}
            >
              {pending ? <Loader2Icon className="animate-spin" /> : <BellOffIcon />}
              Turn off text updates
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            You can also reply STOP to any text to cancel.
          </p>
        </div>
      ) : canOptIn ? (
        <SmsConsentForm
          id="sms-settings"
          source="settings"
          defaultPhone={changing ? "" : state.prefillPhone}
          onOptedIn={() => setChanging(false)}
          secondaryAction={
            changing && (
              <Button
                type="button"
                variant="ghost"
                size="lg"
                className="h-11"
                onClick={() => setChanging(false)}
              >
                Cancel
              </Button>
            )
          }
        />
      ) : null}
    </section>
  )
}
