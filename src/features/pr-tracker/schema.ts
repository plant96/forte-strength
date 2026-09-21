import { z } from "zod"

import { createFormReader } from "@/lib/forms/reader"

import { isDay } from "@/lib/day"
import { isValidShape, SERIES_LIMITS, type PrKind, type SeriesShape } from "./lib/series"
import { WEIGHT_LIMITS } from "./lib/weight"

/**
 * Validation for the two things a lifter can submit: a new movement name, and a record.
 *
 * Numeric fields stay strings, matching the rest of the site's forms, so half-typed input
 * survives a re-render. The shared `createFormReader` collects one friendly error per
 * field the way the TDEE and profile forms do.
 */

export const EXERCISE_NAME_MAX = 60

export const createExerciseSchema = z.object({
  name: z.string().trim().min(1, "Type a movement name").max(EXERCISE_NAME_MAX),
  /** Set once the lifter has seen the near-duplicate warning and chosen to create anyway. */
  force: z.boolean().default(false),
})

export type CreateExerciseInput = z.input<typeof createExerciseSchema>

/** The form state behind the "log a record" step. */
export interface EntryFormInput {
  weight: string
  unit: "lb" | "kg"
  achievedOn: string
  kind: PrKind
  sets: string
  reps: string
}

export interface EntryFormValues {
  weight: number
  unit: "lb" | "kg"
  achievedOn: string
  shape: SeriesShape
}

export const entryFormShape = {
  weight: z.string(),
  unit: z.enum(["lb", "kg"]),
  achievedOn: z.string(),
  kind: z.enum(["one-rep-max", "rep", "volume"]),
  sets: z.string(),
  reps: z.string(),
}

export const entryFormSchema = z.object(entryFormShape).transform((raw, ctx): EntryFormValues => {
  const reader = createFormReader(raw, ctx)

  const weight = reader.number("weight", {
    label: "Weight",
    unit: raw.unit,
    ...WEIGHT_LIMITS[raw.unit],
    requiredMessage: "Enter the weight you lifted",
  })

  if (!isDay(raw.achievedOn)) reader.fail("achievedOn", "Pick the day you hit it")

  // Reps and sets only carry meaning for the kinds that use them; the others are fixed
  // at 1 so a rep PR can never masquerade as a one-rep max.
  let sets = 1
  let reps = 1
  if (raw.kind === "rep") {
    reps = reader.number("reps", {
      label: "Reps",
      integer: true,
      ...SERIES_LIMITS.rep.reps,
      requiredMessage: "How many reps?",
    })
  } else if (raw.kind === "volume") {
    sets = reader.number("sets", {
      label: "Sets",
      integer: true,
      ...SERIES_LIMITS.volume.sets,
      requiredMessage: "How many sets?",
    })
    reps = reader.number("reps", {
      label: "Reps",
      integer: true,
      ...SERIES_LIMITS.volume.reps,
      requiredMessage: "How many reps?",
    })
  }

  if (!reader.valid) return z.NEVER

  const shape: SeriesShape = { kind: raw.kind, sets, reps }
  if (!isValidShape(shape)) {
    reader.fail("reps", "That combination isn't a separate PR type")
    return z.NEVER
  }

  return { weight, unit: raw.unit, achievedOn: raw.achievedOn, shape }
})

/** What the server action accepts. The client sends a reference plus the change, never a row. */
export const addEntrySchema = z.object({
  exerciseId: z.string().min(1),
  kind: z.enum(["one-rep-max", "rep", "volume"]),
  sets: z.number().int().min(1).max(SERIES_LIMITS.volume.sets.max),
  reps: z.number().int().min(1).max(SERIES_LIMITS.rep.reps.max),
  weight: z.number().positive(),
  unit: z.enum(["lb", "kg"]),
  achievedOn: z.string().refine(isDay, "That isn't a real date"),
  /** Only honoured for admins logging on a client's behalf. */
  athleteId: z.string().min(1).optional(),
})

export type AddEntryInput = z.infer<typeof addEntrySchema>

export const ENTRY_FORM_DEFAULTS: Omit<EntryFormInput, "achievedOn" | "unit"> = {
  weight: "",
  kind: "one-rep-max",
  sets: "3",
  reps: "3",
}
