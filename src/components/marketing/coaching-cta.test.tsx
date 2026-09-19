import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { coaching } from "@/config/coaching"

import { CoachingCta } from "./coaching-cta"

describe("CoachingCta", () => {
  it("links to the consultation form in a new tab", () => {
    render(<CoachingCta />)

    const link = screen.getByRole("link", { name: /request a consultation/i })
    expect(link).toHaveAttribute("href", coaching.consultationUrl)
    expect(link).toHaveAttribute("target", "_blank")
    expect(link).toHaveAttribute("rel", "noopener noreferrer")
    expect(link).toHaveAccessibleName(/opens in a new tab/i)
    expect(screen.queryByText(/opens a google form/i)).not.toBeInTheDocument()
  })

  it("introduces the head coach and the team's records", () => {
    render(<CoachingCta />)

    expect(screen.getByText(/Head Coach Tyler Montano/)).toBeInTheDocument()
    expect(screen.getByText("World records")).toBeInTheDocument()
    expect(screen.getByText("American records")).toBeInTheDocument()
  })
})
