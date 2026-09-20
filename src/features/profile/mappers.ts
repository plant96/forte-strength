import type {
  HeightUnit as DbHeightUnit,
  Intensity as DbIntensity,
  Profile,
  Sex as DbSex,
  WeightUnit as DbWeightUnit,
} from "@/generated/prisma/client"
import { cmToFtIn, lbToKg, roundTo, type HeightUnit, type WeightUnit } from "@/lib/units"
import { heightToCm } from "@/features/tdee/body-fields"
import type { Sex, TrainingIntensityId } from "@/features/tdee/lib/constants"
import type { TdeeFormInput } from "@/features/tdee/schema"

import { ageOn, birthdayToDate, dateToBirthday } from "./lib/birthday"
import type { ProfileFormInput, ProfileFormValues } from "./schema"

/** Profile fields as stored in the database (enum values in the DB's style). */
export type ProfileRecord = Pick<
  Profile,
  | "birthDate"
  | "sex"
  | "weight"
  | "weightUnit"
  | "heightCm"
  | "heightUnit"
  | "bodyFatPercent"
  | "stepsPerDay"
  | "sessionsPerWeek"
  | "intensity"
>

const SEX_TO_DB: Record<Sex, DbSex> = { male: "MALE", female: "FEMALE" }
const SEX_FROM_DB: Record<DbSex, Sex> = { MALE: "male", FEMALE: "female" }
/** Shared with the PR tracker, which stores its own gym-weight unit on `User`. */
export const WEIGHT_UNIT_TO_DB: Record<WeightUnit, DbWeightUnit> = { lb: "LB", kg: "KG" }
export const WEIGHT_UNIT_FROM_DB: Record<DbWeightUnit, WeightUnit> = { LB: "lb", KG: "kg" }
const HEIGHT_UNIT_TO_DB: Record<HeightUnit, DbHeightUnit> = { "ft-in": "FT_IN", cm: "CM" }
const HEIGHT_UNIT_FROM_DB: Record<DbHeightUnit, HeightUnit> = { FT_IN: "ft-in", CM: "cm" }
const INTENSITY_TO_DB: Record<TrainingIntensityId, DbIntensity> = {
  "very-light": "VERY_LIGHT",
  light: "LIGHT",
  moderate: "MODERATE",
  hard: "HARD",
  "very-hard": "VERY_HARD",
}
const INTENSITY_FROM_DB: Record<DbIntensity, TrainingIntensityId> = {
  VERY_LIGHT: "very-light",
  LIGHT: "light",
  MODERATE: "moderate",
  HARD: "hard",
  VERY_HARD: "very-hard",
}

const numberText = (value: number, decimals = 1) => String(roundTo(value, decimals))

/** Validated form values → database fields. */
export function profileValuesToRecord(values: ProfileFormValues): ProfileRecord {
  return {
    birthDate: birthdayToDate(values.birthday),
    sex: SEX_TO_DB[values.sex],
    weight: values.weight,
    weightUnit: WEIGHT_UNIT_TO_DB[values.weightUnit],
    heightCm: heightToCm(values.height),
    heightUnit: HEIGHT_UNIT_TO_DB[values.height.unit],
    bodyFatPercent: values.bodyFat,
    stepsPerDay: values.steps,
    sessionsPerWeek: values.sessions,
    intensity: values.intensity === "none" ? null : INTENSITY_TO_DB[values.intensity],
  }
}

/** The shared body fields, filled from a saved profile in the units the user chose. */
function bodyFieldsFromRecord(profile: ProfileRecord) {
  const heightUnit = HEIGHT_UNIT_FROM_DB[profile.heightUnit]
  const { ft, in: inches } = cmToFtIn(profile.heightCm)
  return {
    weight: numberText(profile.weight),
    weightUnit: WEIGHT_UNIT_FROM_DB[profile.weightUnit],
    heightUnit,
    heightFt: String(ft),
    heightIn: numberText(inches),
    heightCm: numberText(profile.heightCm),
    sex: SEX_FROM_DB[profile.sex],
    bodyFat: numberText(profile.bodyFatPercent),
    steps: String(profile.stepsPerDay),
    sessions: String(profile.sessionsPerWeek),
    intensity: profile.intensity ? INTENSITY_FROM_DB[profile.intensity] : "",
  } satisfies Omit<ProfileFormInput, "birthMonth" | "birthDay" | "birthYear" | "liftUnit">
}

/** Database fields → profile form state. */
export function profileRecordToFormInput(
  profile: ProfileRecord,
  liftUnit: WeightUnit = "lb",
): ProfileFormInput {
  const birthday = dateToBirthday(profile.birthDate)
  return {
    ...bodyFieldsFromRecord(profile),
    birthMonth: String(birthday.month),
    birthDay: String(birthday.day),
    birthYear: String(birthday.year),
    liftUnit,
  }
}

/** Database fields → the metric calculator input, with today's age. */
export function profileRecordToTdeeInput(profile: ProfileRecord, today: Date = new Date()) {
  const intensity = profile.intensity ? INTENSITY_FROM_DB[profile.intensity] : ("none" as const)
  return {
    weightKg: profile.weightUnit === "KG" ? profile.weight : lbToKg(profile.weight),
    heightCm: profile.heightCm,
    ageYears: ageOn(dateToBirthday(profile.birthDate), today),
    sex: SEX_FROM_DB[profile.sex],
    bodyFatPercent: profile.bodyFatPercent,
    stepsPerDay: profile.stepsPerDay,
    sessionsPerWeek: profile.sessionsPerWeek,
    intensity: profile.sessionsPerWeek > 0 ? intensity : ("none" as const),
  }
}

/** Database fields → calculator form state, with today's age. */
export function profileRecordToTdeeFormInput(
  profile: ProfileRecord,
  today: Date = new Date(),
): TdeeFormInput {
  return {
    ...bodyFieldsFromRecord(profile),
    age: String(ageOn(dateToBirthday(profile.birthDate), today)),
  }
}
