import "server-only"

import { ApplicationNotificationEmail } from "@/emails/application-notification"
import { ApplicationReceiptEmail } from "@/emails/application-receipt"
import { getCoachProfile } from "@/features/coach/queries"
import { sendEmail, siteUrl } from "@/lib/email"

import type { ApplicationRecord } from "./format"

export const DEFAULT_NOTIFY_EMAIL = "Tym.26911@gmail.com"

export function adminApplicationUrl(id: string) {
  return `${siteUrl()}/admin/applications/${id}`
}

/** Emails the coach and the applicant. Failures are logged, never thrown. */
export async function sendApplicationEmails(application: ApplicationRecord) {
  const coach = await getCoachProfile()
  const notifyTo = process.env.APPLICATION_NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL

  const results = await Promise.allSettled([
    sendEmail({
      to: notifyTo,
      subject: `New application: ${application.fullName}`,
      replyTo: application.email,
      react: (
        <ApplicationNotificationEmail
          application={application}
          adminUrl={adminApplicationUrl(application.id)}
        />
      ),
    }),
    sendEmail({
      to: application.email,
      subject: "We received your application to Team Forte Strength",
      replyTo: notifyTo,
      react: <ApplicationReceiptEmail application={application} coachName={coach.name} />,
    }),
  ])

  for (const result of results) {
    if (result.status === "rejected") {
      console.error(`[applications] Email for ${application.id} failed:`, result.reason)
    }
  }
}
