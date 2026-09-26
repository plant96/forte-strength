import "server-only"

import { formatDate } from "@/lib/dates"
import { db } from "@/server/db"

import { smsPromptDue } from "./consent"
import { formatUsPhone, normalizeUsPhone } from "./lib/phone"

/** Everything the text-updates surfaces need, as plain strings for the client. */
export interface SmsState {
  optedIn: boolean
  /** "(415) 555-2671" while opted in. */
  phone: string | null
  /** "Sep 26, 2026" while opted in. */
  optedInOn: string | null
  /** What the phone field starts with: their last number, else the one on their application. */
  prefillPhone: string
  /** The dashboard opens the prompt by itself. */
  promptDue: boolean
}

interface SmsUser {
  email: string
  smsPhone: string | null
  smsOptInAt: Date | null
  smsPromptSnoozedAt: Date | null
}

/**
 * The number a client gave on their coaching application, if it's a US/Canadian one —
 * so most clients only have to tick the box. Matched by email, newest application first.
 */
async function applicationPhone(email: string) {
  if (!email) return null
  try {
    const application = await db.application.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      orderBy: { createdAt: "desc" },
      select: { phone: true },
    })
    return application ? normalizeUsPhone(application.phone) : null
  } catch (error) {
    console.error("[sms] Could not read the application phone:", error)
    return null
  }
}

export async function getSmsState(user: SmsUser, now: Date = new Date()): Promise<SmsState> {
  const optedIn = Boolean(user.smsOptInAt && user.smsPhone)
  const known = user.smsPhone ?? (await applicationPhone(user.email))

  return {
    optedIn,
    phone: optedIn && user.smsPhone ? formatUsPhone(user.smsPhone) : null,
    optedInOn: optedIn && user.smsOptInAt ? formatDate(user.smsOptInAt) : null,
    prefillPhone: known ? formatUsPhone(known) : "",
    promptDue: smsPromptDue(user, now),
  }
}
