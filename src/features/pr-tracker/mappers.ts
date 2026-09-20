import type { PrKind as DbPrKind } from "@/generated/prisma/client"

import type { PrKind } from "./lib/series"

/**
 * The enum bridge. App-level values are lowercase-kebab, database values are
 * SCREAMING_SNAKE, and nothing crosses that line except through here — the same rule
 * `features/profile/mappers.ts` follows.
 */

export const PR_KIND_TO_DB: Record<PrKind, DbPrKind> = {
  "one-rep-max": "ONE_REP_MAX",
  rep: "REP",
  volume: "VOLUME",
}

export const PR_KIND_FROM_DB: Record<DbPrKind, PrKind> = {
  ONE_REP_MAX: "one-rep-max",
  REP: "rep",
  VOLUME: "volume",
}
