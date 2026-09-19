import type { Application } from "@/generated/prisma/client"

import {
  COACHING_NEEDS,
  CURRENT_COACH_OPTIONS,
  FINANCE_OPTIONS,
  optionLabel,
  QUESTIONS,
  READINESS_OPTIONS,
} from "./options"

export type ApplicationRecord = Application

const numberFormat = new Intl.NumberFormat("en-US", { maximumFractionDigits: 1 })

export function formatLifts(application: ApplicationRecord) {
  const unit = application.liftUnit === "KG" ? "kg" : "lb"
  const total = application.squat + application.bench + application.deadlift
  return {
    unit,
    squat: `${numberFormat.format(application.squat)} ${unit}`,
    bench: `${numberFormat.format(application.bench)} ${unit}`,
    deadlift: `${numberFormat.format(application.deadlift)} ${unit}`,
    total: `${numberFormat.format(total)} ${unit}`,
    competition: application.liftsAreCompetition,
  }
}

export function primaryNeedLabel(
  application: Pick<ApplicationRecord, "primaryNeed" | "primaryNeedOther">,
) {
  return application.primaryNeed === "OTHER" && application.primaryNeedOther
    ? `Other: ${application.primaryNeedOther}`
    : optionLabel(COACHING_NEEDS, application.primaryNeed)
}

export function instagramUrl(handle: string) {
  return `https://instagram.com/${encodeURIComponent(handle.replace(/^@/, ""))}`
}

export interface AnswerItem {
  label: string
  value: string
  hint?: string
  /** Multi-line free-text answers get more room. */
  long?: boolean
}

export interface AnswerSection {
  title: string
  items: AnswerItem[]
}

/** Every answer, grouped the same way as the form. Used by the admin panel and emails. */
export function applicationSections(application: ApplicationRecord): AnswerSection[] {
  const lifts = formatLifts(application)

  return [
    {
      title: "About",
      items: [
        { label: QUESTIONS.fullName.label, value: application.fullName },
        { label: QUESTIONS.age.label, value: String(application.age) },
        { label: QUESTIONS.email.label, value: application.email },
        { label: QUESTIONS.phone.label, value: application.phone },
        { label: QUESTIONS.location.label, value: application.location },
        { label: QUESTIONS.instagram.label, value: `@${application.instagram}` },
      ],
    },
    {
      title: "Lifting",
      items: [
        { label: QUESTIONS.primaryNeed.label, value: primaryNeedLabel(application) },
        {
          label: QUESTIONS.lifts.label,
          value: `${lifts.squat} / ${lifts.bench} / ${lifts.deadlift} (total ${lifts.total})${
            lifts.competition ? ", competition numbers" : ""
          }`,
        },
        { label: QUESTIONS.weightClass.label, value: application.weightClass },
      ],
    },
    {
      title: "Story",
      items: [
        {
          label: QUESTIONS.goals.label,
          hint: QUESTIONS.goals.hint,
          value: application.goals,
          long: true,
        },
        { label: QUESTIONS.challenges.label, value: application.challenges, long: true },
        { label: QUESTIONS.overthinker.label, value: `${application.overthinker} / 10` },
        { label: QUESTIONS.injuries.label, value: application.injuries, long: true },
        {
          label: QUESTIONS.nutritionRestrictions.label,
          value: application.nutritionRestrictions,
          long: true,
        },
        { label: QUESTIONS.programming.label, value: application.programming, long: true },
      ],
    },
    {
      title: "Commitment",
      items: [
        {
          label: QUESTIONS.currentCoach.label,
          value: optionLabel(CURRENT_COACH_OPTIONS, application.currentCoach),
        },
        { label: QUESTIONS.whyForte.label, value: application.whyForte, long: true },
        { label: QUESTIONS.commitment.label, value: application.commitment },
        {
          label: QUESTIONS.financePriority.label,
          value: optionLabel(FINANCE_OPTIONS, application.financePriority),
        },
        {
          label: QUESTIONS.readiness.label,
          value: optionLabel(READINESS_OPTIONS, application.readiness),
        },
      ],
    },
  ]
}
