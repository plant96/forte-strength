import "server-only"

import { Resend } from "resend"

import { siteConfig } from "@/config/site"

interface SendEmailOptions {
  to: string | string[]
  subject: string
  react: React.ReactNode
  replyTo?: string
}

/** Public base URL for links in emails. */
export function siteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? siteConfig.url).replace(/\/$/, "")
}

/**
 * Sends an email through Resend. Without RESEND_API_KEY (e.g. local dev) the
 * email is logged instead, so the rest of the flow still works.
 */
export async function sendEmail({ to, subject, react, replyTo }: SendEmailOptions) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.info(`[email] RESEND_API_KEY not set. Would send "${subject}" to ${String(to)}.`)
    return { skipped: true as const }
  }

  const from = process.env.EMAIL_FROM ?? "Forte Strength Systems <onboarding@resend.dev>"
  const { data, error } = await new Resend(apiKey).emails.send({
    from,
    to,
    subject,
    react,
    replyTo,
  })
  if (error) throw new Error(`Resend: ${error.message}`)
  return { skipped: false as const, id: data?.id }
}
