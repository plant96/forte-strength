import "server-only"

import { ApplicationNotificationEmail } from "@/emails/application-notification"
import { ApplicationReceiptEmail } from "@/emails/application-receipt"
import { getCoachProfile } from "@/features/coach/queries"
import { notifyRecipient } from "@/features/notifications/notify"
import { isNotificationEnabled } from "@/features/notifications/queries"
import { sendEmail, siteUrl } from "@/lib/email"

import type { ApplicationRecord } from "./format"

export { DEFAULT_NOTIFY_EMAIL } from "@/features/notifications/notify"

export function adminApplicationUrl(id: string) {
  return `${siteUrl()}/admin/applications/${id}`
}

/**
 * Emails the coach (if the "Application received" notification is on) and the
 * applicant (always — they're waiting on it). Failures are logged, never thrown.
 */
export async function sendApplicationEmails(application: ApplicationRecord) {
  const [coach, coachWantsIt] = await Promise.all([
    getCoachProfile(),
    isNotificationEnabled("application-received"),
  ])
  const notifyTo = notifyRecipient()

  const sends = [
    sendEmail({
      to: application.email,
      subject: "We received your application to Team Forte Strength",
      replyTo: notifyTo,
      react: <ApplicationReceiptEmail application={application} coachName={coach.name} />,
    }),
  ]
  if (coachWantsIt) {
    sends.push(
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
    )
  }

  const results = await Promise.allSettled(sends)
  for (const result of results) {
    if (result.status === "rejected") {
      console.error(`[applications] Email for ${application.id} failed:`, result.reason)
    }
  }
}
