import { render, toPlainText } from "@react-email/render"
import { describe, expect, it } from "vitest"

import type { ApplicationRecord } from "@/features/applications/format"

import { ApplicationNotificationEmail } from "./application-notification"
import { ApplicationReceiptEmail } from "./application-receipt"

const APPLICATION: ApplicationRecord = {
  id: "app_123",
  status: "UNPROCESSED",
  processedAt: null,
  createdAt: new Date("2026-09-18T16:30:00Z"),
  updatedAt: new Date("2026-09-18T16:30:00Z"),
  fullName: "Jordan Lee",
  age: 27,
  email: "jordan@example.com",
  phone: "(407) 555-0142",
  location: "Tampa, FL",
  instagram: "jordan.lifts",
  primaryNeed: "OTHER",
  primaryNeedOther: "Strongman prep",
  squat: 405,
  bench: 275,
  deadlift: 500,
  liftUnit: "LB",
  liftsAreCompetition: true,
  weightClass: "90 kg",
  goals: "Qualify for Nationals.",
  challenges: "Staying consistent with sleep.",
  overthinker: 7,
  injuries: "Old left knee sprain.",
  nutritionRestrictions: "Lactose intolerant.",
  programming: "4 days, upper/lower.",
  currentCoach: "NO_BUT_HAVE_BEFORE",
  whyForte: "Saw the team compete.",
  commitment: "I am prepared",
  financePriority: "PREMIUM",
  readiness: "READY_NOW",
}

const ADMIN_URL = "https://fortestrength.org/admin/applications/app_123"

describe("application emails", () => {
  it("gives the coach every answer and a link to the admin panel", async () => {
    const html = await render(
      <ApplicationNotificationEmail application={APPLICATION} adminUrl={ADMIN_URL} />,
    )
    const text = toPlainText(html)

    expect(html).toContain(`href="${ADMIN_URL}"`)
    expect(text).toContain("View in admin panel")
    for (const answer of [
      "Jordan Lee",
      "jordan@example.com",
      "(407) 555-0142",
      "Tampa, FL",
      "@jordan.lifts",
      "Other: Strongman prep",
      "405 lb / 275 lb / 500 lb (total 1,180 lb), competition numbers",
      "90 kg",
      "Qualify for Nationals.",
      "Staying consistent with sleep.",
      "7 / 10",
      "Old left knee sprain.",
      "Lactose intolerant.",
      "4 days, upper/lower.",
      "No, but I have before",
      "Saw the team compete.",
      "I am prepared",
      "I want a premium service I can afford",
      "Yes, I am ready to begin now",
    ]) {
      expect(text, answer).toContain(answer)
    }
    expect(html).toContain('href="mailto:jordan@example.com"')
  })

  it("sends the applicant a copy of their answers without the admin link", async () => {
    const html = await render(
      <ApplicationReceiptEmail application={APPLICATION} coachName="Tyler Montano" />,
    )
    const text = toPlainText(html)

    expect(text).toContain("Qualify for Nationals.")
    expect(text).toContain("Tyler")
    expect(html).not.toContain("/admin/")
  })
})
