/**
 * The text-message program's wording, in one place.
 *
 * Carriers review the opt-in form, the Terms and the use case filed with Twilio side by
 * side, and reject the application when they disagree — so every surface reads from here.
 * If the wording changes, bump `SMS_CONSENT_VERSION`: each opt-in stores the text and the
 * version it was shown, which is the proof of what someone agreed to.
 */

export const SMS_PROGRAM_NAME = "Forte Strength Systems text updates"

/** What the texts are about, as the consent names it. */
export const SMS_MESSAGE_TOPICS = "training sessions, schedule changes, and account updates"

export const SMS_CONSENT_TEXT = `I agree to receive automated text messages from Forte Strength Systems about my ${SMS_MESSAGE_TOPICS}. Message frequency varies. Message and data rates may apply. Reply HELP for help or STOP to cancel at any time. Consent is not a condition of purchase.`

export const SMS_CONSENT_VERSION = "2026-09-26"

/** Where Settings shows text updates; the coach can send a client to /profile#text-updates. */
export const SMS_SETTINGS_ANCHOR = "text-updates"

/** After "Not now", the dashboard waits this long before asking again. */
export const SMS_PROMPT_SNOOZE_DAYS = 7

const DAY_MS = 86_400_000

/** Whether the dashboard should open the text-updates prompt by itself. */
export function smsPromptDue(
  user: { smsOptInAt: Date | null; smsPromptSnoozedAt: Date | null },
  now: Date = new Date(),
) {
  if (user.smsOptInAt) return false
  if (!user.smsPromptSnoozedAt) return true
  return now.getTime() - user.smsPromptSnoozedAt.getTime() >= SMS_PROMPT_SNOOZE_DAYS * DAY_MS
}
