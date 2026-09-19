import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { MotionProvider } from "@/components/motion/motion-provider"

import { submitApplication } from "../actions"
import { APPLICATION_DEFAULTS, type ApplicationFormInput } from "../schema"
import { ApplicationForm } from "./application-form"

vi.mock("../actions", () => ({ submitApplication: vi.fn() }))

const DRAFT_KEY = "forte:application-draft:v1"

const ABOUT: Partial<ApplicationFormInput> = {
  fullName: "Jordan Lee",
  age: "27",
  email: "jordan@example.com",
  phone: "(407) 555-0142",
  location: "Tampa, FL",
  instagram: "jordan.lifts",
}

const COMPLETE: ApplicationFormInput = {
  ...APPLICATION_DEFAULTS,
  ...ABOUT,
  primaryNeed: "COMPETITIVE_POWERLIFTING",
  squat: "405",
  bench: "275",
  deadlift: "500",
  weightClass: "90 kg",
  goals: "Qualify for Nationals.",
  challenges: "Consistency.",
  overthinker: "7",
  injuries: "None",
  nutritionRestrictions: "None",
  programming: "4 days, upper/lower.",
  currentCoach: "NO_NEVER",
  whyForte: "Saw the team compete.",
  commitment: "I am prepared",
  financePriority: "PREMIUM",
  readiness: "READY_NOW",
}

function renderForm(draft?: Partial<ApplicationFormInput>) {
  if (draft) localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  const user = userEvent.setup()
  render(
    <MotionProvider>
      <ApplicationForm />
    </MotionProvider>,
  )
  return user
}

const stepHeading = (name: string) => screen.findByRole("heading", { level: 2, name })

describe("ApplicationForm", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.mocked(submitApplication).mockReset()
  })

  afterEach(() => {
    toast.dismiss()
  })

  it("checks each step before moving on", async () => {
    const user = renderForm()

    await user.click(screen.getByRole("button", { name: "Continue" }))
    expect(await screen.findByText("Enter your first and last name")).toBeInTheDocument()
    expect(screen.getByText("Enter your email")).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "About you" })).toBeInTheDocument()

    await user.type(screen.getByLabelText("First & last name"), "Jordan Lee")
    await user.type(screen.getByLabelText("Age"), "27")
    await user.type(screen.getByLabelText("Email"), "jordan@example.com")
    await user.type(screen.getByLabelText("Phone number"), "4075550142")
    await user.type(screen.getByLabelText("Where are you from?"), "Tampa, FL")
    await user.type(screen.getByLabelText("Instagram username"), "jordan.lifts")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    expect(await stepHeading("Your lifting")).toBeInTheDocument()
    // The next step's fields haven't been validated yet.
    expect(screen.queryByText("Choose your primary need")).not.toBeInTheDocument()
  })

  it("asks for details when the primary need is Other", async () => {
    const user = renderForm(ABOUT)
    await user.click(screen.getByRole("button", { name: "Continue" }))
    await stepHeading("Your lifting")

    await user.click(await screen.findByRole("radio", { name: "Other" }))
    const other = await screen.findByLabelText("Tell us your primary need")
    await user.click(screen.getByRole("button", { name: "Continue" }))

    expect(await screen.findByText("Tell us what you need")).toBeInTheDocument()
    expect(screen.getByText("Enter your squat")).toBeInTheDocument()

    await user.type(other, "Strongman")
    await user.tab()
    expect(screen.queryByText("Tell us what you need")).not.toBeInTheDocument()
  })

  it("adds up the total as lifts are entered", async () => {
    const user = renderForm(ABOUT)
    await user.click(screen.getByRole("button", { name: "Continue" }))
    await stepHeading("Your lifting")

    await user.type(await screen.findByLabelText("Squat"), "200")
    await user.type(screen.getByLabelText("Bench"), "140")
    await user.type(screen.getByLabelText("Deadlift"), "240")
    await user.click(screen.getByRole("radio", { name: "kg" }))

    expect(screen.getByText(/^Total/)).toHaveTextContent("Total 580 kg")
  })

  it("restores a saved draft and submits it", async () => {
    vi.mocked(submitApplication).mockResolvedValue({ ok: true })
    const user = renderForm({ ...COMPLETE, website: "should be ignored" })

    expect(await screen.findByDisplayValue("Jordan Lee")).toBeInTheDocument()

    for (const next of ["Your lifting", "Your story", "Commitment"]) {
      await user.click(screen.getByRole("button", { name: "Continue" }))
      await stepHeading(next)
    }
    await user.click(screen.getByRole("button", { name: "Submit application" }))

    await vi.waitFor(() => expect(useRouter().push).toHaveBeenCalledWith("/application/submitted"))
    expect(submitApplication).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: "Jordan Lee", commitment: "I am prepared", website: "" }),
    )
    expect(localStorage.getItem(DRAFT_KEY)).toBeNull()
  })

  it("won't submit without the commitment phrase", async () => {
    const user = renderForm({ ...COMPLETE, commitment: "sure" })
    for (const next of ["Your lifting", "Your story", "Commitment"]) {
      await user.click(screen.getByRole("button", { name: "Continue" }))
      await stepHeading(next)
    }
    await user.click(screen.getByRole("button", { name: "Submit application" }))

    expect(await screen.findByText("Type “I am prepared” exactly to continue")).toBeInTheDocument()
    expect(submitApplication).not.toHaveBeenCalled()
  })
})
