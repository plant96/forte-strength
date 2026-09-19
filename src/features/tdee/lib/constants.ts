export type Sex = "male" | "female"

export const SEX_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
] as const satisfies ReadonlyArray<{ id: Sex; label: string }>

/** Training intensity levels and their score `I` in the activity model. */
export const INTENSITY_LEVELS = [
  {
    id: "none",
    label: "No training",
    score: 0,
    description: "No structured training sessions.",
  },
  {
    id: "very-light",
    label: "Very light",
    score: 0.2,
    description: "Easy movement: mobility work, light yoga, casual cycling.",
  },
  {
    id: "light",
    label: "Light",
    score: 0.4,
    description: "Comfortable effort you could hold a conversation through.",
  },
  {
    id: "moderate",
    label: "Moderate",
    score: 0.6,
    description: "Solid working sets with a few reps left in the tank (≈RPE 6–7).",
  },
  {
    id: "hard",
    label: "Hard",
    score: 0.8,
    description: "Challenging sessions taken close to failure (≈RPE 8–9).",
  },
  {
    id: "very-hard",
    label: "Very hard",
    score: 1,
    description: "All-out training: max efforts, high volume, short rest (≈RPE 9–10).",
  },
] as const

export type IntensityId = (typeof INTENSITY_LEVELS)[number]["id"]
export type TrainingIntensityId = Exclude<IntensityId, "none">

/** Levels a user can pick; "none" is implied when they train 0 sessions a week. */
export const SELECTABLE_INTENSITY_LEVELS = INTENSITY_LEVELS.filter(
  (level): level is Extract<(typeof INTENSITY_LEVELS)[number], { id: TrainingIntensityId }> =>
    level.id !== "none",
)

export function getIntensityLevel(id: IntensityId) {
  const level = INTENSITY_LEVELS.find((candidate) => candidate.id === id)
  if (!level) throw new Error(`Unknown intensity level: ${id}`)
  return level
}

/** Accepted input ranges. Values outside these are rejected by the form. */
export const INPUT_LIMITS = {
  weight: { lb: { min: 70, max: 700 }, kg: { min: 30, max: 320 } },
  heightCm: { min: 90, max: 250 },
  heightFt: { min: 3, max: 8 },
  heightIn: { min: 0, max: 11.9 },
  age: { min: 15, max: 90 },
  bodyFat: { min: 3, max: 60 },
  steps: { min: 0, max: 50_000 },
  sessions: { min: 0, max: 14 },
} as const
