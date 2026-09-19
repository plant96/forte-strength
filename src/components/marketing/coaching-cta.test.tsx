import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { COACH_PROFILE_DEFAULTS, coachReachSentence } from "@/config/coaching"

import { CoachingCtaView } from "./coaching-cta"

describe("CoachingCtaView", () => {
  it("links to the on-site application", () => {
    render(<CoachingCtaView profile={COACH_PROFILE_DEFAULTS} />)

    const link = screen.getByRole("link", { name: /apply for coaching/i })
    expect(link).toHaveAttribute("href", "/application")
  })

  it("shows the coach's current record counts", () => {
    render(
      <CoachingCtaView
        profile={{
          ...COACH_PROFILE_DEFAULTS,
          worldRecords: 3,
          americanRecords: 14,
          stateRecords: 41,
        }}
      />,
    )

    expect(screen.getByText(/Head Coach Tyler Montano/)).toBeInTheDocument()
    expect(screen.getByText("3×")).toBeInTheDocument()
    expect(screen.getByText("14×")).toBeInTheDocument()
    expect(screen.getByText("41")).toBeInTheDocument()
  })
})

describe("coachReachSentence", () => {
  it("joins the reach list naturally", () => {
    expect(coachReachSentence(COACH_PROFILE_DEFAULTS)).toBe(
      "Based in Orlando, FL, with lifters across 12 states, the UK, Romania, Canada and the Middle East.",
    )
    expect(coachReachSentence({ ...COACH_PROFILE_DEFAULTS, reach: [] })).toBe(
      "Based in Orlando, FL.",
    )
  })
})
