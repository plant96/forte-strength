/**
 * Application questions and answer options, shared by the form, the admin panel
 * and the notification emails so the wording only lives in one place.
 */

export const COACHING_NEEDS = [
  { value: "COMPETITIVE_POWERLIFTING", label: "Competitive powerlifting" },
  { value: "RECREATIONAL_POWERLIFTING", label: "Recreational powerlifting" },
  { value: "WEIGHT_LOSS_RECOMP", label: "Weight loss / body recomp" },
  { value: "OTHER", label: "Other" },
] as const

export const CURRENT_COACH_OPTIONS = [
  {
    value: "YES_LOOKING_FOR_BETTER",
    label: "Yes, but I'm looking for a better approach",
    short: "Has a coach",
  },
  { value: "NO_BUT_HAVE_BEFORE", label: "No, but I have before", short: "Had one before" },
  { value: "NO_NEVER", label: "No, I've never hired one before", short: "Never had one" },
] as const

export const FINANCE_OPTIONS = [
  {
    value: "MOST_COST_EFFECTIVE",
    label: "I'm looking for the most cost-effective option within my budget",
    short: "Most cost-effective",
  },
  {
    value: "SOLID_AFFORDABLE",
    label: "I don't want to break the bank, but I want a solid package I can afford",
    short: "Solid & affordable",
  },
  { value: "PREMIUM", label: "I want a premium service I can afford", short: "Premium" },
] as const

export const READINESS_OPTIONS = [
  { value: "READY_NOW", label: "Yes, I am ready to begin now", short: "Ready now" },
  {
    value: "NEED_TO_PREPARE",
    label: "Yes, however I need to get a few things in order first",
    short: "Needs to prepare",
  },
  {
    value: "NOT_SURE",
    label: "Not sure just yet, I need some time to think",
    short: "Not sure yet",
  },
] as const

export type CoachingNeedValue = (typeof COACHING_NEEDS)[number]["value"]
export type CurrentCoachValue = (typeof CURRENT_COACH_OPTIONS)[number]["value"]
export type FinancePriorityValue = (typeof FINANCE_OPTIONS)[number]["value"]
export type ReadinessValue = (typeof READINESS_OPTIONS)[number]["value"]

type Option = { value: string; label: string; short?: string }

export function optionLabel(options: readonly Option[], value: string) {
  return options.find((option) => option.value === value)?.label ?? value
}

export function optionShort(options: readonly Option[], value: string) {
  const option = options.find((candidate) => candidate.value === value)
  return option?.short ?? option?.label ?? value
}

/** Question wording, keyed by field. */
export const QUESTIONS = {
  fullName: { label: "First & last name" },
  age: { label: "Age" },
  email: { label: "Email" },
  phone: { label: "Phone number" },
  location: { label: "Where are you from?", hint: "Include your state and/or country." },
  instagram: { label: "Instagram username" },
  primaryNeed: { label: "What is your primary need with coaching?" },
  lifts: {
    label: "Best squat / bench / deadlift",
    hint: "Competition numbers if possible.",
  },
  weightClass: {
    label: "Current weight class",
    hint: "If you don't know it, enter your current bodyweight.",
  },
  goals: {
    label: "Here's your chance to tell me your story.",
    hint: "Be VERY specific: what are ALL of the goals you're hoping to accomplish in the next 3–6 months?",
  },
  challenges: {
    label: "What are the BIGGEST challenges you've run into when aiming for these goals?",
    hint: "Be specific.",
  },
  overthinker: {
    label: "On a scale of 1–10, how much of an overthinker would you consider yourself to be?",
  },
  injuries: {
    label: "List all SERIOUS injuries you've battled in your pursuit of strength or recomp.",
    hint: "Write “None” if you haven't had any.",
  },
  nutritionRestrictions: {
    label: "List ALL nutritional restrictions you face.",
    hint: "Write “None” if you don't have any.",
  },
  programming: {
    label:
      "Give me a brief summary of your current programming, and what you think is lacking in it.",
  },
  currentCoach: { label: "Do you currently have a coach?" },
  whyForte: {
    label: "Why specifically are you applying to join Team Forte Strength?",
    hint: "If a friend referred you, list them here as well.",
  },
  commitment: {
    label: "Are you prepared to execute to a standard?",
    hint: "I expect all of my athletes to be COACHABLE, and ready to accept all feedback I provide to give us the best chance at reaching your goals. Type “I am prepared” if you understand.",
  },
  financePriority: { label: "When choosing a coaching plan, how will finances be weighed?" },
  readiness: {
    label: "Are you ready right now for me to create your program?",
    hint: "Forte Strength Systems is an elite group focused on taking every athlete to the top of their potential, whether that be Nationals, NAPFS or Worlds.",
  },
} as const satisfies Record<string, { label: string; hint?: string }>
