import "server-only"

import { unstable_rethrow } from "next/navigation"

import { getBestLifts } from "@/features/pr-tracker/queries"
import { profileRecordToDotsFormInput } from "@/features/profile/mappers"
import type { Viewer } from "@/features/profile/queries"
import { kgToLb, roundTo } from "@/lib/units"

import { totalFromBestLifts } from "./lib/best-total"
import type { DotsFormInput } from "./schema"

export interface DotsAutofill {
  initialValues: DotsFormInput
  /** True when the total came from the PR tracker's best 1RMs. */
  totalFromPrs: boolean
}

/**
 * Calculator values for the viewer: bodyweight, age and sex from their profile, and, for
 * clients with a squat, bench and deadlift 1RM logged, the total from the PR tracker.
 */
export async function getDotsAutofill(viewer: Viewer): Promise<DotsAutofill | undefined> {
  if (!viewer.profile) return undefined
  const initialValues = profileRecordToDotsFormInput(viewer.profile, viewer.liftUnit)
  if (!viewer.unlocked || !viewer.id) return { initialValues, totalFromPrs: false }

  try {
    const totalKg = totalFromBestLifts(await getBestLifts(viewer.id))
    if (totalKg === null) return { initialValues, totalFromPrs: false }
    const total = viewer.liftUnit === "kg" ? totalKg : kgToLb(totalKg)
    return {
      initialValues: { ...initialValues, total: String(roundTo(total, 1)) },
      totalFromPrs: true,
    }
  } catch (error) {
    unstable_rethrow(error)
    console.error("[dots] Could not load best lifts for autofill:", error)
    return { initialValues, totalFromPrs: false }
  }
}
