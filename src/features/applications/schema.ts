import { z } from "zod"

import { createFormReader } from "@/lib/forms/reader"
import type { WeightUnit } from "@/lib/units"

import {
  COACHING_NEEDS,
  CURRENT_COACH_OPTIONS,
  FINANCE_OPTIONS,
  READINESS_OPTIONS,
  type CoachingNeedValue,
  type CurrentCoachValue,
  type FinancePriorityValue,
  type ReadinessValue,
} from "./options"

const LONG_TEXT_MAX = 5000

/** Raw application form state. Numeric fields stay strings while typing. */
export interface ApplicationFormInput {
  fullName: string
  age: string
  email: string
  phone: string
  location: string
  instagram: string
  primaryNeed: CoachingNeedValue | ""
  primaryNeedOther: string
  squat: string
  bench: string
  deadlift: string
  liftUnit: WeightUnit
  liftsAreCompetition: boolean
  weightClass: string
  goals: string
  challenges: string
  overthinker: string
  injuries: string
  nutritionRestrictions: string
  programming: string
  currentCoach: CurrentCoachValue | ""
  whyForte: string
  commitment: string
  financePriority: FinancePriorityValue | ""
  readiness: ReadinessValue | ""
  /** Honeypot: hidden from people, filled in by bots. */
  website: string
}

/** A validated application, ready to store. */
export interface ApplicationValues {
  fullName: string
  age: number
  email: string
  phone: string
  location: string
  instagram: string
  primaryNeed: CoachingNeedValue
  primaryNeedOther: string | null
  squat: number
  bench: number
  deadlift: number
  liftUnit: WeightUnit
  liftsAreCompetition: boolean
  weightClass: string
  goals: string
  challenges: string
  overthinker: number
  injuries: string
  nutritionRestrictions: string
  programming: string
  currentCoach: CurrentCoachValue
  whyForte: string
  commitment: string
  financePriority: FinancePriorityValue
  readiness: ReadinessValue
  isSpam: boolean
}

export const APPLICATION_DEFAULTS: ApplicationFormInput = {
  fullName: "",
  age: "",
  email: "",
  phone: "",
  location: "",
  instagram: "",
  primaryNeed: "",
  primaryNeedOther: "",
  squat: "",
  bench: "",
  deadlift: "",
  liftUnit: "lb",
  liftsAreCompetition: false,
  weightClass: "",
  goals: "",
  challenges: "",
  overthinker: "",
  injuries: "",
  nutritionRestrictions: "",
  programming: "",
  currentCoach: "",
  whyForte: "",
  commitment: "",
  financePriority: "",
  readiness: "",
  website: "",
}

/** Fields shown on each step of the form, for step-by-step validation. */
export const APPLICATION_STEPS = [
  {
    id: "about",
    title: "About you",
    fields: ["fullName", "age", "email", "phone", "location", "instagram"],
  },
  {
    id: "lifting",
    title: "Your lifting",
    fields: ["primaryNeed", "primaryNeedOther", "squat", "bench", "deadlift", "weightClass"],
  },
  {
    id: "story",
    title: "Your story",
    fields: [
      "goals",
      "challenges",
      "overthinker",
      "injuries",
      "nutritionRestrictions",
      "programming",
    ],
  },
  {
    id: "commitment",
    title: "Commitment",
    fields: ["currentCoach", "whyForte", "commitment", "financePriority", "readiness"],
  },
] as const satisfies ReadonlyArray<{
  id: string
  title: string
  fields: ReadonlyArray<keyof ApplicationFormInput>
}>

const values = <T extends readonly { value: string }[]>(options: T) =>
  options.map((option) => option.value) as unknown as [T[number]["value"], ...T[number]["value"][]]

const emailSchema = z.email()

/** Accepts "I am prepared" in any case, with or without trailing punctuation. */
export function isCommitmentPhrase(text: string) {
  return /^i am prepared[.!]*$/i.test(text.trim().replace(/\s+/g, " "))
}

export const applicationSchema = z
  .object({
    fullName: z.string(),
    age: z.string(),
    email: z.string(),
    phone: z.string(),
    location: z.string(),
    instagram: z.string(),
    primaryNeed: z.enum([...values(COACHING_NEEDS), ""]),
    primaryNeedOther: z.string(),
    squat: z.string(),
    bench: z.string(),
    deadlift: z.string(),
    liftUnit: z.enum(["lb", "kg"]),
    liftsAreCompetition: z.boolean(),
    weightClass: z.string(),
    goals: z.string(),
    challenges: z.string(),
    overthinker: z.string(),
    injuries: z.string(),
    nutritionRestrictions: z.string(),
    programming: z.string(),
    currentCoach: z.enum([...values(CURRENT_COACH_OPTIONS), ""]),
    whyForte: z.string(),
    commitment: z.string(),
    financePriority: z.enum([...values(FINANCE_OPTIONS), ""]),
    readiness: z.enum([...values(READINESS_OPTIONS), ""]),
    website: z.string(),
  })
  .transform((raw, ctx): ApplicationValues => {
    const read = createFormReader(raw, ctx)

    // About you
    const fullName = read.text("fullName", {
      label: "Name",
      max: 100,
      requiredMessage: "Enter your first and last name",
    })
    const age = read.number("age", { label: "Age", integer: true, min: 13, max: 100 })
    const email = read.text("email", { label: "Email", max: 254 }).toLowerCase()
    if (email && !emailSchema.safeParse(email).success) read.fail("email", "Enter a valid email")
    const phone = read.text("phone", { label: "Phone number", max: 30 })
    if (phone && (phone.replace(/\D/g, "").length < 7 || !/^[\d\s()+.\-]+$/.test(phone))) {
      read.fail("phone", "Enter a valid phone number")
    }
    const location = read.text("location", {
      label: "Location",
      max: 120,
      requiredMessage: "Tell us where you're from",
    })
    const instagram = read
      .text("instagram", { label: "Instagram username", max: 31 })
      .replace(/^@/, "")
    if (instagram && !/^[A-Za-z0-9._]{1,30}$/.test(instagram)) {
      read.fail("instagram", "Use letters, numbers, periods and underscores only")
    }

    // Your lifting
    if (raw.primaryNeed === "") read.fail("primaryNeed", "Choose your primary need")
    let primaryNeedOther: string | null = null
    if (raw.primaryNeed === "OTHER") {
      primaryNeedOther = read.text("primaryNeedOther", {
        label: "Your primary need",
        max: 200,
        requiredMessage: "Tell us what you need",
      })
    }
    const liftRule = { max: raw.liftUnit === "kg" ? 700 : 1500, min: 0, unit: raw.liftUnit }
    const squat = read.number("squat", { label: "Squat", ...liftRule })
    const bench = read.number("bench", { label: "Bench", ...liftRule })
    const deadlift = read.number("deadlift", { label: "Deadlift", ...liftRule })
    const weightClass = read.text("weightClass", {
      label: "Weight class",
      max: 60,
      requiredMessage: "Enter your weight class or bodyweight",
    })

    // Your story
    const long = (field: keyof typeof raw & string, label: string) =>
      read.text(field, { label, max: LONG_TEXT_MAX, requiredMessage: "This one's required" })
    const goals = long("goals", "Your goals")
    const challenges = long("challenges", "Your challenges")
    const overthinker = read.number("overthinker", {
      label: "Overthinker score",
      integer: true,
      min: 1,
      max: 10,
      requiredMessage: "Pick a number from 1 to 10",
    })
    const injuries = long("injuries", "Injuries")
    const nutritionRestrictions = long("nutritionRestrictions", "Nutritional restrictions")
    const programming = long("programming", "Your programming")

    // Commitment
    if (raw.currentCoach === "") read.fail("currentCoach", "Choose an answer")
    const whyForte = long("whyForte", "Your answer")
    const commitment = read.text("commitment", {
      label: "Commitment",
      max: 40,
      requiredMessage: "Type “I am prepared” to continue",
    })
    if (commitment && !isCommitmentPhrase(commitment)) {
      read.fail("commitment", "Type “I am prepared” exactly to continue")
    }
    if (raw.financePriority === "") read.fail("financePriority", "Choose an answer")
    if (raw.readiness === "") read.fail("readiness", "Choose an answer")

    if (
      !read.valid ||
      raw.primaryNeed === "" ||
      raw.currentCoach === "" ||
      raw.financePriority === "" ||
      raw.readiness === ""
    ) {
      return z.NEVER
    }

    return {
      fullName,
      age,
      email,
      phone,
      location,
      instagram,
      primaryNeed: raw.primaryNeed,
      primaryNeedOther,
      squat,
      bench,
      deadlift,
      liftUnit: raw.liftUnit,
      liftsAreCompetition: raw.liftsAreCompetition,
      weightClass,
      goals,
      challenges,
      overthinker,
      injuries,
      nutritionRestrictions,
      programming,
      currentCoach: raw.currentCoach,
      whyForte,
      commitment: "I am prepared",
      financePriority: raw.financePriority,
      readiness: raw.readiness,
      isSpam: raw.website.trim() !== "",
    }
  })
