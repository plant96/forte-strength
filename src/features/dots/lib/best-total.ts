import type { BestLifts } from "@/features/pr-tracker/lib/lifts"

/**
 * The competition total from a lifter's best 1RMs, in kg. Null unless all three lifts have
 * one: a partial total would quietly understate the score.
 */
export function totalFromBestLifts(best: BestLifts): number | null {
  const squat = best.lifts.squat[1]
  const bench = best.lifts.bench[1]
  const deadlift = best.lifts.deadlift[1]
  if (!squat || !bench || !deadlift) return null
  return squat.weightKg + bench.weightKg + deadlift.weightKg
}
