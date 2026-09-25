import type { CompetitionLift } from "@/features/pr-tracker/lib/lifts"

export type AgeGroupId = "teen1" | "teen2" | "teen3" | "junior" | "open" | "masters"

export interface AgeGroup {
  id: AgeGroupId
  /** As shown in the picker, e.g. "Open (24–39)". */
  label: string
  /** As shown in a chip, e.g. "Open". */
  short: string
  minAge: number
  /** Null for the open-ended top group. */
  maxAge: number | null
}

/** USA Powerlifting-style age groups. Lifters under 14 are in no group. */
export const AGE_GROUPS: readonly AgeGroup[] = [
  { id: "teen1", label: "Teen 1 (14–15)", short: "Teen 1", minAge: 14, maxAge: 15 },
  { id: "teen2", label: "Teen 2 (16–17)", short: "Teen 2", minAge: 16, maxAge: 17 },
  { id: "teen3", label: "Teen 3 (18–19)", short: "Teen 3", minAge: 18, maxAge: 19 },
  { id: "junior", label: "JR (20–23)", short: "JR", minAge: 20, maxAge: 23 },
  { id: "open", label: "Open (24–39)", short: "Open", minAge: 24, maxAge: 39 },
  { id: "masters", label: "Masters (40+)", short: "Masters", minAge: 40, maxAge: null },
]

export function ageGroupFor(ageYears: number): AgeGroupId | null {
  const group = AGE_GROUPS.find(
    (candidate) =>
      ageYears >= candidate.minAge && (candidate.maxAge === null || ageYears <= candidate.maxAge),
  )
  return group?.id ?? null
}

export type WeightClassId = "59" | "67.5" | "75" | "83" | "93" | "110" | "110+"

export interface WeightClass {
  id: WeightClassId
  /** The merged IPF/USAPL limits the class covers, e.g. "82.5–83 kg". */
  label: string
  /** The heaviest bodyweight that still fits; null for the open-ended top class. */
  maxKg: number | null
}

/**
 * Each class is an upper bound: a lifter belongs to the lightest class whose limit they are
 * at or under, so 62 kg lands in 66–67.5 and 47 kg in 52–59. Not split by sex.
 */
export const WEIGHT_CLASSES: readonly WeightClass[] = [
  { id: "59", label: "52–59 kg", maxKg: 59 },
  { id: "67.5", label: "66–67.5 kg", maxKg: 67.5 },
  { id: "75", label: "74–75 kg", maxKg: 75 },
  { id: "83", label: "82.5–83 kg", maxKg: 83 },
  { id: "93", label: "90–93 kg", maxKg: 93 },
  { id: "110", label: "100–110 kg", maxKg: 110 },
  { id: "110+", label: "120–125 kg+", maxKg: null },
]

const OPEN_CLASS = WEIGHT_CLASSES[WEIGHT_CLASSES.length - 1]!

export function weightClassFor(bodyweightKg: number): WeightClassId {
  const found = WEIGHT_CLASSES.find(
    (candidate) => candidate.maxKg !== null && bodyweightKg <= candidate.maxKg,
  )
  return (found ?? OPEN_CLASS).id
}

export function ageGroupLabel(id: AgeGroupId) {
  return AGE_GROUPS.find((group) => group.id === id)?.label ?? id
}

export function ageGroupShort(id: AgeGroupId) {
  return AGE_GROUPS.find((group) => group.id === id)?.short ?? id
}

export function weightClassLabel(id: WeightClassId) {
  return WEIGHT_CLASSES.find((weightClass) => weightClass.id === id)?.label ?? id
}

/** What the lift board is filtered by. */
export interface LiftFilters {
  ageGroup: AgeGroupId
  weightClass: WeightClassId
  lift: CompetitionLift
}

export const DEFAULT_LIFT_FILTERS: LiftFilters = {
  ageGroup: "open",
  weightClass: "83",
  lift: "squat",
}

/** A signed-in lifter starts on their own group and class; everyone else gets the defaults. */
export function defaultLiftFilters(
  body: { ageYears: number; bodyweightKg: number } | null,
): LiftFilters {
  if (!body) return DEFAULT_LIFT_FILTERS
  return {
    ageGroup: ageGroupFor(body.ageYears) ?? DEFAULT_LIFT_FILTERS.ageGroup,
    weightClass: weightClassFor(body.bodyweightKg),
    lift: DEFAULT_LIFT_FILTERS.lift,
  }
}

/** A stable key for one filter combination, used to animate between boards. */
export function filtersKey(filters: LiftFilters) {
  return `${filters.ageGroup}|${filters.weightClass}|${filters.lift}`
}
