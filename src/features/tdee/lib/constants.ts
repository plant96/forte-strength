export type Sex = "male" | "female"

export const SEX_OPTIONS = [
  { id: "male", label: "Male" },
  { id: "female", label: "Female" },
] as const satisfies ReadonlyArray<{ id: Sex; label: string }>

export const INTENSITY_IDS = [
  "none",
  "very-light",
  "light",
  "moderate",
  "hard",
  "very-hard",
] as const

export type IntensityId = (typeof INTENSITY_IDS)[number]
export type TrainingIntensityId = Exclude<IntensityId, "none">

export interface IntensityLevel<Id extends IntensityId = IntensityId> {
  id: Id
  label: string
  /** Intensity score `I` in the activity model. */
  score: number
  /** One-sentence summary shown under the intensity picker. */
  description: string
  /** Typical sessions at this level, shown in the intensity reference. */
  examples: readonly string[]
  note?: string
}

/** Shown with the very light level and in the intensity guide. */
export const STEP_OVERLAP_NOTE =
  "Already counting those walks in your daily steps? That's fine. The activity multiplier corrects for the overlap."

/** Training intensity levels, from none to very hard. */
export const INTENSITY_LEVELS: readonly IntensityLevel[] = [
  {
    id: "none",
    label: "No training",
    score: 0,
    description: "No structured training sessions.",
    examples: [],
  },
  {
    id: "very-light",
    label: "Very light",
    score: 0.2,
    description: "Walking or light jogging.",
    examples: ["Walking", "Light jogging"],
    note: STEP_OVERLAP_NOTE,
  },
  {
    id: "light",
    label: "Light",
    score: 0.4,
    description: "Jogging to running, or low-intensity resistance training.",
    examples: ["Jogging to running", "Low-intensity resistance training"],
  },
  {
    id: "moderate",
    label: "Moderate",
    score: 0.6,
    description: "Resistance training with free weights, or Zone 3 cardio.",
    examples: ["Free-weight resistance training", "Zone 3 cardio"],
  },
  {
    id: "hard",
    label: "Hard",
    score: 0.8,
    description:
      "Highly strenuous resistance training built on compound lifts, Zone 3–4 cardio, or CrossFit.",
    examples: ["Highly strenuous compound-lift training", "Zone 3–4 cardio", "CrossFit"],
  },
  {
    id: "very-hard",
    label: "Very hard",
    score: 1,
    description:
      "Sprint training, HYROX, high-frequency Olympic lifting, or extremely strenuous compound-lift training.",
    examples: [
      "Sprint training",
      "HYROX",
      "High-frequency Olympic lifting",
      "Extremely strenuous compound-lift training",
    ],
  },
]

/** Levels a user can pick; "none" is implied when they train 0 sessions a week. */
export const SELECTABLE_INTENSITY_LEVELS = INTENSITY_LEVELS.filter(
  (level): level is IntensityLevel<TrainingIntensityId> => level.id !== "none",
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
