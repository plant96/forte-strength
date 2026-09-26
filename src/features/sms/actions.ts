"use server"

import { revalidatePath } from "next/cache"
import { headers } from "next/headers"

import { clientIpFrom } from "@/features/analytics/lib/geo"
import { getClientAreaUser, requireUser } from "@/server/auth"
import { db } from "@/server/db"

import { SMS_CONSENT_TEXT, SMS_CONSENT_VERSION } from "./consent"
import { normalizeUsPhone } from "./lib/phone"
import { SMS_SOURCE_TO_DB } from "./mappers"
import { SMS_SOURCES, smsOptInSchema, type SmsOptInInput, type SmsSource } from "./schema"

export type SmsActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Partial<Record<keyof SmsOptInInput, string>> }

const TRY_AGAIN = "Something went wrong. Please try again."

/** Who agreed and from where, for the consent record. */
async function requestDetails() {
  const list = await headers()
  return {
    ipAddress: clientIpFrom(list),
    userAgent: list.get("user-agent")?.slice(0, 1000) ?? null,
  }
}

function isSource(value: unknown): value is SmsSource {
  return SMS_SOURCES.includes(value as SmsSource)
}

/**
 * Turns text updates on. Coaching clients (and admins) only: the program is about their
 * training. The ticked box is checked again here — a direct POST can skip the form — and
 * the exact wording they saw is stored with the number, time, IP and browser.
 */
export async function optInToSms(
  input: SmsOptInInput,
  source: SmsSource,
): Promise<SmsActionResult> {
  const user = await getClientAreaUser()
  if (!user) return { ok: false, message: "Text updates are for coaching clients." }
  if (!isSource(source)) return { ok: false, message: TRY_AGAIN }

  const parsed = smsOptInSchema.safeParse(input)
  const phone = parsed.success ? normalizeUsPhone(parsed.data.phone) : null
  if (!parsed.success || !phone) {
    const fieldErrors: Partial<Record<keyof SmsOptInInput, string>> = {}
    for (const issue of parsed.error?.issues ?? []) {
      const field = issue.path[0] as keyof SmsOptInInput | undefined
      if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
    }
    return { ok: false, message: "Check your number and the consent box.", fieldErrors }
  }

  const now = new Date()
  try {
    await db.$transaction([
      db.user.update({
        where: { id: user.id },
        data: { smsPhone: phone, smsOptInAt: now },
      }),
      db.smsConsentEvent.create({
        data: {
          userId: user.id,
          phone,
          action: "OPT_IN",
          source: SMS_SOURCE_TO_DB[source],
          consentText: SMS_CONSENT_TEXT,
          consentVersion: SMS_CONSENT_VERSION,
          ...(await requestDetails()),
          createdAt: now,
        },
      }),
    ])
  } catch (error) {
    console.error("[sms] Could not record the opt-in:", error)
    return { ok: false, message: "We couldn't turn on text updates. Please try again." }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

/**
 * Turns text updates off. Open to any signed-in account, not just clients: someone who
 * stops coaching must still be able to stop the texts.
 */
export async function optOutOfSms(source: SmsSource): Promise<SmsActionResult> {
  const user = await requireUser()
  if (!isSource(source)) return { ok: false, message: TRY_AGAIN }
  if (!user.smsOptInAt) return { ok: true }

  try {
    await db.$transaction([
      db.user.update({ where: { id: user.id }, data: { smsOptInAt: null } }),
      db.smsConsentEvent.create({
        data: {
          userId: user.id,
          phone: user.smsPhone ?? "",
          action: "OPT_OUT",
          source: SMS_SOURCE_TO_DB[source],
          ...(await requestDetails()),
        },
      }),
    ])
  } catch (error) {
    console.error("[sms] Could not record the opt-out:", error)
    return { ok: false, message: "We couldn't turn off text updates. Please try again." }
  }

  revalidatePath("/", "layout")
  return { ok: true }
}

/** "Not now" on the dashboard prompt: it stays closed for a while, then asks again. */
export async function snoozeSmsPrompt(): Promise<SmsActionResult> {
  const user = await getClientAreaUser()
  if (!user) return { ok: false, message: TRY_AGAIN }

  try {
    await db.user.update({ where: { id: user.id }, data: { smsPromptSnoozedAt: new Date() } })
  } catch (error) {
    console.error("[sms] Could not snooze the prompt:", error)
    return { ok: false, message: TRY_AGAIN }
  }
  return { ok: true }
}
