import type { SmsConsentSource } from "@/generated/prisma/client"

import type { SmsSource } from "./schema"

/** The enum bridge, the same rule as `features/profile/mappers.ts`. */
export const SMS_SOURCE_TO_DB: Record<SmsSource, SmsConsentSource> = {
  dashboard: "DASHBOARD",
  settings: "SETTINGS",
  "sms-page": "SMS_PAGE",
}
