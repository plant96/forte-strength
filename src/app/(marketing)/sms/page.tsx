import {
  BanIcon,
  CalendarCheckIcon,
  CheckCircle2Icon,
  CircleHelpIcon,
  ReceiptIcon,
  RepeatIcon,
  SettingsIcon,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { SmsConsentForm } from "@/features/sms/components/sms-consent-form"
import { SMS_MESSAGE_TOPICS, SMS_PROGRAM_NAME, SMS_SETTINGS_ANCHOR } from "@/features/sms/consent"
import { getSmsState } from "@/features/sms/queries"
import { canAccessClientArea, getCurrentUser } from "@/server/auth"

const description = `Get automated texts from ${siteConfig.name} about your ${SMS_MESSAGE_TOPICS}.`

export const metadata: Metadata = {
  title: "Text updates",
  description,
  alternates: { canonical: "/sms" },
}

const SETTINGS_HREF = `/profile#${SMS_SETTINGS_ANCHOR}`

const DETAILS = [
  {
    icon: CalendarCheckIcon,
    title: "What you'll get",
    body: `Automated texts about your ${SMS_MESSAGE_TOPICS}. Nothing promotional.`,
  },
  { icon: RepeatIcon, title: "How often", body: "Message frequency varies." },
  { icon: ReceiptIcon, title: "Cost", body: "Message and data rates may apply." },
  {
    icon: CircleHelpIcon,
    title: "Help",
    body: `Reply HELP to any text, or email ${siteConfig.supportEmail}.`,
  },
  {
    icon: BanIcon,
    title: "Stopping",
    body: "Reply STOP to cancel at any time, or turn texts off in Settings.",
  },
]

/**
 * The text program's public home, and the page carriers review as proof of opt-in: the
 * same form as the dashboard and Settings, with every disclosure beside it. Clients can
 * opt in here; everyone else sees the form exactly as a client would, just not usable.
 */
export default async function SmsPage() {
  const user = await getCurrentUser()
  const canOptIn = canAccessClientArea(user)
  const sms = user && canOptIn ? await getSmsState(user) : null

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 flex max-w-2xl flex-col gap-3">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
          Coaching clients
        </p>
        <h1 className="font-heading text-4xl leading-[1.02] font-extrabold uppercase sm:text-5xl">
          Text updates
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          {SMS_PROGRAM_NAME}: your coach can reach you the moment something about your training
          changes.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)]">
        <section aria-label="Program details" className="flex flex-col gap-3">
          <ul className="flex flex-col gap-3">
            {DETAILS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-4 rounded-2xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-highlight">
                  <Icon className="size-5" />
                </span>
                <div className="flex flex-col gap-0.5">
                  <h2 className="font-heading text-lg font-bold uppercase">{title}</h2>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="px-1 text-sm text-muted-foreground">
            Consent is not a condition of purchase. Read the{" "}
            <Link href="/terms" className="text-highlight underline-offset-4 hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link href="/privacy" className="text-highlight underline-offset-4 hover:underline">
              Privacy Policy
            </Link>
            .
          </p>
        </section>

        <section
          aria-labelledby="sms-signup-heading"
          className="flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-primary/35 sm:p-6 lg:sticky lg:top-24"
        >
          {sms?.optedIn ? (
            <div className="flex flex-col items-start gap-4">
              <span className="grid size-12 place-items-center rounded-full bg-primary/15 text-highlight ring-1 ring-primary/30">
                <CheckCircle2Icon className="size-6" />
              </span>
              <div className="flex flex-col gap-1">
                <h2 id="sms-signup-heading" className="font-heading text-2xl font-bold uppercase">
                  You&apos;re signed up
                </h2>
                <p className="text-sm text-muted-foreground">
                  Texts go to <span className="text-foreground tabular-nums">{sms.phone}</span>.
                  Reply STOP to any of them to cancel.
                </p>
              </div>
              <Button asChild variant="outline" className="h-10">
                <Link href={SETTINGS_HREF}>
                  <SettingsIcon />
                  Manage in Settings
                </Link>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <h2 id="sms-signup-heading" className="font-heading text-2xl font-bold uppercase">
                  Turn on text updates
                </h2>
                {!canOptIn && (
                  <p className="text-sm text-muted-foreground">
                    {user
                      ? "Text updates are for Forte Strength coaching clients."
                      : "Coaching clients: sign in to turn on text updates."}
                  </p>
                )}
              </div>
              <SmsConsentForm
                id="sms-page"
                source="sms-page"
                defaultPhone={sms?.prefillPhone}
                preview={!canOptIn}
                previewAction={
                  user ? (
                    <Button
                      asChild
                      size="lg"
                      className="h-11 font-heading tracking-wider uppercase"
                    >
                      <Link href={siteConfig.cta.href}>Apply for coaching</Link>
                    </Button>
                  ) : (
                    <Button
                      asChild
                      size="lg"
                      className="h-11 font-heading tracking-wider uppercase"
                    >
                      <Link href="/sign-in?redirect_url=/sms">Sign in to turn on texts</Link>
                    </Button>
                  )
                }
              />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
