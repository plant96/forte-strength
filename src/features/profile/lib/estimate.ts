import { calculateTdee } from "@/features/tdee/lib/tdee"
import { toTdeeInput } from "@/features/tdee/schema"

import type { ProfileFormValues } from "../schema"
import { ageOn } from "./birthday"

/** Maintenance calories for a validated profile, using today's age. */
export function estimateTdee(values: ProfileFormValues, today: Date = new Date()) {
  const age = ageOn(values.birthday, today)
  return calculateTdee(toTdeeInput({ ...values, age }))
}
