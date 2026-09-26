import type { Metadata } from "next"
import Link from "next/link"

import { siteConfig } from "@/config/site"
import { SMS_MESSAGE_TOPICS, SMS_PROGRAM_NAME } from "@/features/sms/consent"

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms for ${siteConfig.name}, including the text message program.`,
  alternates: { canonical: "/terms" },
}

const LAST_UPDATED = "September 26, 2026"

const linkClass = "text-highlight underline-offset-4 hover:underline"

/**
 * The SMS program's terms, in the shape carriers check for: program name, what is sent,
 * frequency, rates, HELP and STOP, carrier liability, and a contact. Keep the wording in
 * step with the opt-in form (`features/sms/consent.ts`) — reviewers compare the two.
 */
export default function TermsPage() {
  const email = siteConfig.supportEmail

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 space-y-4">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
          Last updated {LAST_UPDATED}
        </p>
        <h1 className="font-heading text-4xl leading-[1.02] font-extrabold uppercase sm:text-5xl">
          Terms of Service
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          These terms cover the text message program run by {siteConfig.name}. By opting in to text
          messages you agree to them.
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <section className="space-y-3" aria-labelledby="sms-program">
          <h2 id="sms-program" className="font-heading text-2xl font-bold text-foreground">
            Text message program
          </h2>
          <p>
            <strong className="text-foreground">Program name:</strong> {SMS_PROGRAM_NAME}.
          </p>
          <p>
            Coaching clients of {siteConfig.name} can choose to receive automated text messages
            about their {SMS_MESSAGE_TOPICS}. We don&apos;t send promotional or marketing messages
            through this program.
          </p>
          <p>
            You opt in by entering your mobile number and ticking the consent box on your client
            dashboard, in your account settings, or on our{" "}
            <Link href="/sms" className={linkClass}>
              text updates page
            </Link>
            . Consent is not a condition of purchase.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="sms-frequency">
          <h2 id="sms-frequency" className="font-heading text-2xl font-bold text-foreground">
            Message frequency and cost
          </h2>
          <p>
            Message frequency varies. Message and data rates may apply; check your mobile plan for
            details. Texts are available to US and Canadian mobile numbers.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="sms-help-stop">
          <h2 id="sms-help-stop" className="font-heading text-2xl font-bold text-foreground">
            Help and opting out
          </h2>
          <p>
            Reply <strong className="text-foreground">HELP</strong> to any message for help, or
            email{" "}
            <a href={`mailto:${email}`} className={linkClass}>
              {email}
            </a>
            .
          </p>
          <p>
            Reply <strong className="text-foreground">STOP</strong> to any message to cancel at any
            time. You&apos;ll receive one final message confirming you&apos;ve been unsubscribed,
            and no further messages after that. You can also turn text messages off in your account
            settings. To opt back in, reply <strong className="text-foreground">START</strong> or
            turn them back on in your settings.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="sms-carriers">
          <h2 id="sms-carriers" className="font-heading text-2xl font-bold text-foreground">
            Carriers
          </h2>
          <p>Carriers are not liable for delayed or undelivered messages.</p>
        </section>

        <section className="space-y-3" aria-labelledby="sms-privacy">
          <h2 id="sms-privacy" className="font-heading text-2xl font-bold text-foreground">
            Privacy
          </h2>
          <p>
            Our{" "}
            <Link href="/privacy" className={linkClass}>
              Privacy Policy
            </Link>{" "}
            explains how we handle your mobile number and consent. No mobile information will be
            shared with third parties or affiliates for marketing or promotional purposes.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="terms-contact">
          <h2 id="terms-contact" className="font-heading text-2xl font-bold text-foreground">
            Contact
          </h2>
          <p>
            Questions about these terms: email{" "}
            <a href={`mailto:${email}`} className={linkClass}>
              {email}
            </a>
            .
          </p>
        </section>
      </div>
    </article>
  )
}
