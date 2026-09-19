import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { COACH_PROFILE_DEFAULTS } from "@/config/coaching"
import { coachProfileToFormInput } from "@/features/coach/schema"

import { updateCoachProfile } from "../actions"
import { CoachProfileForm } from "./coach-profile-form"

vi.mock("../actions", () => ({ updateCoachProfile: vi.fn() }))

function renderForm() {
  const user = userEvent.setup()
  render(<CoachProfileForm initialValues={coachProfileToFormInput(COACH_PROFILE_DEFAULTS)} />)
  const preview = screen.getByText("Live preview").closest("aside") as HTMLElement
  return { user, preview }
}

describe("CoachProfileForm", () => {
  it("steps record counts and previews them live", async () => {
    const { user, preview } = renderForm()
    expect(screen.getByRole("button", { name: /save changes/i })).toBeDisabled()

    await user.click(screen.getByRole("button", { name: "One more world records" }))
    await user.click(screen.getByRole("button", { name: "One fewer state records" }))

    expect(screen.getByLabelText("World records")).toHaveValue("3")
    expect(within(preview).getByText("3×")).toBeInTheDocument()
    expect(within(preview).getByText("37")).toBeInTheDocument()
    expect(screen.getByText("You have unsaved changes.")).toBeInTheDocument()
  })

  it("never steps below zero", async () => {
    const { user } = renderForm()
    const world = screen.getByLabelText("World records")
    await user.clear(world)
    await user.type(world, "0")
    await user.click(screen.getByRole("button", { name: "One fewer world records" }))
    expect(world).toHaveValue("0")
  })

  it("updates the reach sentence as places are typed", async () => {
    const { user, preview } = renderForm()
    const reach = screen.getByLabelText("Where your lifters are")
    await user.clear(reach)
    await user.type(reach, "Texas, Japan")
    expect(preview).toHaveTextContent("Based in Orlando, FL, with lifters across Texas and Japan.")
  })

  it("saves the edited values", async () => {
    vi.mocked(updateCoachProfile).mockResolvedValue({ ok: true })
    const { user } = renderForm()

    await user.click(screen.getByRole("button", { name: "One more american records" }))
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    await vi.waitFor(() =>
      expect(updateCoachProfile).toHaveBeenCalledWith(
        expect.objectContaining({ americanRecords: "12", worldRecords: "2" }),
      ),
    )
    expect(await screen.findByText("Everything's up to date.")).toBeInTheDocument()
  })

  it("shows field errors instead of saving bad values", async () => {
    vi.mocked(updateCoachProfile).mockClear()
    const { user } = renderForm()
    const state = screen.getByLabelText("State records")
    await user.clear(state)
    await user.type(state, "lots")
    await user.click(screen.getByRole("button", { name: /save changes/i }))

    expect(await screen.findByText("Enter a number")).toBeInTheDocument()
    expect(state).toHaveAttribute("aria-invalid", "true")
    expect(updateCoachProfile).not.toHaveBeenCalled()
  })
})
