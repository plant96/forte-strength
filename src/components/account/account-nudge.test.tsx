import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { AccountNudge } from "./account-nudge"

describe("AccountNudge", () => {
  it("invites signed-out visitors to create an account", () => {
    render(<AccountNudge state="signed-out" />)
    expect(screen.getByText("Create an account to save your metrics")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/sign-up")
  })

  it("sends signed-in users without a profile to onboarding", () => {
    render(<AccountNudge state="needs-profile" />)
    expect(screen.getByText("Complete your profile to autofill your metrics")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /set up profile/i })).toHaveAttribute(
      "href",
      "/onboarding",
    )
  })

  it("renders nothing once the profile exists", () => {
    const { container } = render(<AccountNudge state="complete" />)
    expect(container).toBeEmptyDOMElement()
  })
})
