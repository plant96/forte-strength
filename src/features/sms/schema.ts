import { z } from "zod"

import { normalizeUsPhone } from "./lib/phone"

export const SMS_SOURCES = ["dashboard", "settings", "sms-page"] as const

export type SmsSource = (typeof SMS_SOURCES)[number]

/** The opt-in form as typed. The box starts unticked and nothing is sent until it is. */
export interface SmsOptInInput {
  phone: string
  consent: boolean
}

export const smsOptInSchema = z.object({
  phone: z
    .string()
    .trim()
    .min(1, "Enter your mobile number")
    .refine((value) => normalizeUsPhone(value) !== null, "Enter a 10-digit US or Canadian number"),
  consent: z.boolean().refine((value) => value, "Tick the box to agree to text updates"),
})
