import type { Metadata } from "next"
import { connection } from "next/server"

import { GEOIP_ENDPOINT, RETENTION_DAYS } from "@/features/analytics/lib/config"

export const metadata: Metadata = {
  title: "Analytics privacy",
  description: "How Forte Strength uses website analytics and visitor cookies.",
  alternates: { canonical: "/privacy" },
}

export default async function AnalyticsPrivacyPage() {
  await connection()

  return (
    <article className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-10 space-y-4">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
          Website analytics
        </p>
        <h1 className="font-heading text-4xl leading-[1.02] font-extrabold uppercase sm:text-5xl">
          Analytics privacy
        </h1>
        <p className="text-base leading-relaxed text-muted-foreground sm:text-lg">
          Forte Strength uses website analytics to understand which pages visitors use, how they
          find us, and how long they spend on the site. This notice covers that analytics feature.
        </p>
      </header>

      <div className="space-y-8 text-sm leading-relaxed text-muted-foreground sm:text-base">
        <section className="space-y-3" aria-labelledby="analytics-data">
          <h2 id="analytics-data" className="font-heading text-2xl font-bold text-foreground">
            What we collect
          </h2>
          <p>
            Each recorded visit includes the page path and title, visit time, referring page and
            campaign tags, IP address, approximate location when available, browser and operating
            system, device type, screen and window size, language, time zone, and the time the page
            is visible. Visitor and session identifiers let us group visits and recognize returning
            browsers. These analytics records are not linked to your account.
          </p>
        </section>

        <section className="space-y-3" aria-labelledby="analytics-cookies">
          <h2 id="analytics-cookies" className="font-heading text-2xl font-bold text-foreground">
            Visitor cookies
          </h2>
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
          <h2 id="analytics-location" className="font-heading text-2xl font-bold text-foreground">
            Approximate location
          </h2>
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
          <h2 id="analytics-retention" className="font-heading text-2xl font-bold text-foreground">
            Access and retention
          </h2>
          <p>
            Analytics reports, including individual visit records and IP addresses, are available
            only to site administrators. Automatic cleanup removes visit records older than{" "}
            {RETENTION_DAYS} days. Expired records may remain until the next successful cleanup.
            Administrators can also remove expired records manually.
          </p>
        </section>
      </div>
    </article>
  )
}
