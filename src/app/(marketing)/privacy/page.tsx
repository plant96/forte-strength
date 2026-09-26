import type { Metadata } from "next"
import Link from "next/link"
import { connection } from "next/server"

import { siteConfig } from "@/config/site"
import { GEOIP_ENDPOINT, RETENTION_DAYS } from "@/features/analytics/lib/config"
import { SMS_MESSAGE_TOPICS } from "@/features/sms/consent"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "How Forte Strength handles your mobile number and text message consent, and what website analytics collect.",
  alternates: { canonical: "/privacy" },
}

const LAST_UPDATED = "September 26, 2026"

const linkClass = "text-highlight underline-offset-4 hover:underline"

/**
 * The text-message section's two sharing sentences are the ones carriers look for; keep
 * them word for word. The analytics sections describe what `features/analytics` does.
 */
export default async function PrivacyPolicyPage() {
  await connection()
  const email = siteConfig.supportEmail

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 space-y-4">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
          Last updated {LAST_UPDATED}
        </p>
        <h1 className="font-heading text-4xl leading-[1.02] font-extrabold uppercase sm:text-5xl">
          Privacy Policy
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          This policy explains how {siteConfig.name} handles your mobile number and text message
          consent, and the website analytics we collect.
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <section className="space-y-3" aria-labelledby="sms">
          <h2 id="sms" className="font-heading text-2xl font-bold text-foreground">
            Text messages (SMS)
          </h2>
          <p>
            If you opt in to text updates, we collect your mobile number and a record of your
            consent: when you agreed, the exact wording you agreed to, and the IP address and
            browser you used. If you opt out, we record that too.
          </p>
          <p>
            We use your mobile number only to send the text messages you signed up for, about your{" "}
            {SMS_MESSAGE_TOPICS}. A messaging provider delivers those texts for us.
          </p>
          <p className="text-foreground">
            No mobile information will be shared with third parties or affiliates for marketing or
            promotional purposes. Text messaging opt-in data and consent will not be shared with any
            third parties.
          </p>
          <p>
            You can stop text messages at any time by replying STOP, or by turning them off in your
            account settings. We keep the record of your consent and opt-out after you stop, and
            after your account is deleted, as proof of your choice. See our{" "}
            <Link href="/terms" className={linkClass}>
              Terms of Service
            </Link>{" "}
            for the full text message terms.
          </p>
        </section>

        <h2 className="pt-2 font-heading text-3xl font-bold text-foreground uppercase">
          Website analytics
        </h2>
        <p className="-mt-5">
          We use website analytics to understand which pages visitors use, how they find us, and how
          long they spend on the site.
        </p>

        <section className="space-y-3" aria-labelledby="analytics-data">
          <h3 id="analytics-data" className="font-heading text-2xl font-bold text-foreground">
            What we collect
          </h3>
          <p>
            Each recorded visit includes the page path and title, visit time, referring page and
            campaign tags, IP address, approximate location when available, browser and operating
            system, device type, screen and window size, language, time zone, and the time the page
            is visible. Visitor and session identifiers let us group visits and recognize returning
            browsers. These analytics records are not linked to your account.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="analytics-cookies">
          <h3 id="analytics-cookies" className="font-heading text-2xl font-bold text-foreground">
            Visitor cookies
          </h3>
          <p>
            We use two first-party cookies with randomly generated identifiers: <code>fs_vid</code>{" "}
            recognizes a browser for up to one year, and <code>fs_sid</code> groups visits into a
            session. Their expiry is renewed with each recorded page view; the session cookie
            expires after 30 minutes without another recorded page view. These identifiers are
            pseudonymous, meaning they identify a browser rather than naming a person.
          </p>
          <p>
            You can delete or block these cookies in your browser settings. Deleting them resets the
            identifiers; it does not erase visits already recorded or stop new page views from being
            recorded.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="analytics-location">
          <h3 id="analytics-location" className="font-heading text-2xl font-bold text-foreground">
            Approximate location
          </h3>
          <p>
            Country, region, city, and approximate map coordinates come from information supplied by
            our hosting platform when available. This is an estimate from your network connection,
            not your device&apos;s GPS location.
          </p>
          <p>
            {GEOIP_ENDPOINT
              ? "An additional location provider is configured. When hosting location information is unavailable, we may send your public IP address to that provider to estimate your location."
              : "No additional IP location provider is configured. This analytics feature uses only location information supplied by our hosting platform."}
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="analytics-retention">
          <h3 id="analytics-retention" className="font-heading text-2xl font-bold text-foreground">
            Access and retention
          </h3>
          <p>
            Analytics reports, including individual visit records and IP addresses, are available
            only to site administrators. Automatic cleanup removes visit records older than{" "}
            {RETENTION_DAYS} days. Expired records may remain until the next successful cleanup.
            Administrators can also remove expired records manually.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="contact">
          <h2 id="contact" className="font-heading text-2xl font-bold text-foreground">
            Contact
          </h2>
          <p>
            Questions about this policy: email{" "}
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
