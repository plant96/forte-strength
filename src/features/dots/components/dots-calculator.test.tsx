import { render, screen, within } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { afterEach, describe, expect, it } from "vitest"

import { MotionProvider } from "@/components/motion/motion-provider"
import { Toaster } from "@/components/ui/sonner"
import { formatNumber } from "@/lib/breakdown/format"
import { kgToLb } from "@/lib/units"

import { calculateDots } from "../lib/dots"
import { calculateRequiredTotal } from "../lib/reverse"
import { DOTS_FORM_DEFAULTS, dotsFormSchema, toDotsInput, type DotsFormInput } from "../schema"
import { DotsCalculator } from "./dots-calculator"

/** 205 lb, 30 y male with a 1,543 lb total: 92.99 kg and 699.89 kg. */
const REFERENCE: DotsFormInput = {
  weight: "205",
  weightUnit: "lb",
  total: "1543",
  totalUnit: "lb",
  age: "30",
  sex: "male",
}

const SCORES = /^DOTS score: 445\.\d\d\. Age-adjusted: 445\.\d\d\. GLP: 91\.\d\d\.$/

function renderCalculator(props: React.ComponentProps<typeof DotsCalculator> = {}) {
  const user = userEvent.setup()
  render(
    <MotionProvider>
      <DotsCalculator {...props} />
    </MotionProvider>,
  )
  return user
}

async function fillReferenceInputs(user: UserEvent) {
  await user.type(screen.getByLabelText("Bodyweight"), REFERENCE.weight)
  await user.type(screen.getByLabelText("Age"), REFERENCE.age)
  await user.click(screen.getByRole("radio", { name: "Male" }))
  await user.type(screen.getByLabelText("Total"), REFERENCE.total)
}

const calculate = (user: UserEvent) =>
  user.click(screen.getByRole("button", { name: /calculate scores/i }))

describe("DotsCalculator", () => {
  it("shows validation errors instead of results when fields are empty", async () => {
    const user = renderCalculator()
    await calculate(user)

    expect(await screen.findByText("Enter your weight")).toBeInTheDocument()
    expect(screen.getByText("Enter your total")).toBeInTheDocument()
    expect(screen.getByText("Enter your age")).toBeInTheDocument()
    expect(screen.getByText("Select your sex")).toBeInTheDocument()
    expect(screen.getByText("Your results will appear here")).toBeInTheDocument()
  })

  it("calculates DOTS, age-adjusted DOTS and GLP", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await calculate(user)

    expect(await screen.findByText(SCORES)).toBeInTheDocument()
    expect(screen.getByText("Age-adjusted DOTS")).toBeInTheDocument()
    expect(screen.getByText("× 1.000 age coefficient")).toBeInTheDocument()
    expect(screen.getByText("IPF GL points")).toBeInTheDocument()
    // The hero counts up to the score; screen readers get the final value. At 30 the age
    // coefficient is 1, so the age-adjusted tile shows the same number.
    const { dots } = calculateDots(toDotsInput(dotsFormSchema.parse(REFERENCE)))
    expect(screen.getAllByText(formatNumber(dots.score, 2), { selector: ".sr-only" })).toHaveLength(
      2,
    )
  })

  it("updates results live after the first calculation", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await calculate(user)
    await screen.findByText(SCORES)

    const total = screen.getByLabelText("Total")
    await user.clear(total)
    await user.type(total, "1500")

    expect(screen.queryByText(SCORES)).not.toBeInTheDocument()
    expect(screen.getByText(/^DOTS score: [\d,.]+\. Age-adjusted: /)).toBeInTheDocument()
  })

  it("converts the total when its unit changes", async () => {
    const user = renderCalculator()
    await user.type(screen.getByLabelText("Total"), "1543")

    await user.click(screen.getByLabelText("Total unit"))
    await user.click(await screen.findByRole("option", { name: "kg" }))

    expect(screen.getByLabelText("Total")).toHaveValue("699.9")
  })

  it("opens the calculation panel with the same numbers", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await calculate(user)
    await screen.findByText(SCORES)

    await user.click(screen.getByRole("button", { name: /view the calculations/i }))

    const panel = await screen.findByRole("dialog", { name: "How your scores were calculated" })
    expect(await within(panel).findByText("92.99 kg")).toBeInTheDocument()
    expect(within(panel).getByText("699.89 kg")).toBeInTheDocument()
    expect(within(panel).getByRole("heading", { name: "IPF GL points" })).toBeInTheDocument()
    expect(within(panel).getByRole("heading", { name: "Age adjustment" })).toBeInTheDocument()
    expect(within(panel).getByRole("heading", { name: "Variables" })).toBeInTheDocument()
    expect(within(panel).queryByRole("heading", { name: "Required total" })).toBeNull()
  })

  it("works backwards from a target score to the total it needs", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await calculate(user)
    await screen.findByText(SCORES)

    const section = screen.getByRole("region", { name: /required total/i })
    // An open-age lifter's coefficient is 1, so only the one tile shows.
    expect(within(section).getAllByText("Enter a score to see the total.")).toHaveLength(1)
    expect(within(section).queryByText("Including your age coefficient")).toBeNull()
    expect(within(section).getByText(/^445\.\d\d DOTS$/)).toBeInTheDocument()

    await user.type(within(section).getByLabelText("Desired score"), "500")

    const input = toDotsInput(dotsFormSchema.parse(REFERENCE))
    const expected = calculateRequiredTotal({ ...input, kind: "dots", score: 500 })
    const lb = formatNumber(kgToLb(expected.totalKg), 0)
    expect(await within(section).findByText(lb, { selector: ".sr-only" })).toBeInTheDocument()
    expect(within(section).getByText("for 500.00 DOTS")).toBeInTheDocument()
    const gap = formatNumber(kgToLb(expected.totalKg - input.totalKg), 0)
    expect(within(section).getByText(`${gap} lb more than your current total`)).toBeInTheDocument()

    await user.click(within(section).getByLabelText("Score type"))
    await user.click(await screen.findByRole("option", { name: "GLP" }))

    // 500 is a fine DOTS target but beyond any GLP score, so the box asks for a new number.
    expect(await within(section).findByText("Score must be 1–300")).toBeInTheDocument()
    expect(within(section).getByText(/GLP has no age adjustment/)).toBeInTheDocument()
    expect(within(section).getByText(/^91\.\d\d GLP$/)).toBeInTheDocument()

    const score = within(section).getByLabelText("Desired score")
    await user.clear(score)
    await user.type(score, "100")

    expect(await within(section).findByText("for 100.00 GLP")).toBeInTheDocument()
    const glp = calculateRequiredTotal({ ...input, kind: "glp", score: 100 })
    expect(
      within(section).getByText(formatNumber(kgToLb(glp.totalKg), 0), { selector: ".sr-only" }),
    ).toBeInTheDocument()
  })

  it("offers quick-pick scores and says when the lifter already clears one", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await calculate(user)
    await screen.findByText(SCORES)

    const picks = screen.getByRole("group", { name: "Quick picks" })
    await user.click(within(picks).getByRole("button", { name: "300" }))

    expect(screen.getByLabelText("Desired score")).toHaveValue("300")
    expect(within(picks).getByRole("button", { name: "300" })).toHaveAttribute(
      "aria-pressed",
      "true",
    )
    expect(await screen.findByText("for 300.00 DOTS")).toBeInTheDocument()
    // A 445-DOTS lifter already totals more than 300 DOTS needs.
    const input = toDotsInput(dotsFormSchema.parse(REFERENCE))
    const needed = calculateRequiredTotal({ ...input, kind: "dots", score: 300 })
    const margin = formatNumber(kgToLb(input.totalKg - needed.totalKg), 0)
    expect(
      screen.getByText(`Your current total already clears it by ${margin} lb`),
    ).toBeInTheDocument()

    // Switching kinds swaps the presets.
    await user.click(screen.getByLabelText("Score type"))
    await user.click(await screen.findByRole("option", { name: "GLP" }))
    expect(within(picks).getByRole("button", { name: "100" })).toBeInTheDocument()
    expect(within(picks).queryByRole("button", { name: "300" })).toBeNull()
  })

  it("shows the age-adjusted requirement for masters lifters", async () => {
    const user = renderCalculator()
    await user.type(screen.getByLabelText("Bodyweight"), REFERENCE.weight)
    await user.type(screen.getByLabelText("Age"), "50")
    await user.click(screen.getByRole("radio", { name: "Male" }))
    await user.type(screen.getByLabelText("Total"), REFERENCE.total)
    await calculate(user)
    await screen.findByText(/^DOTS score: 445\.\d\d\. Age-adjusted: 474\.\d\d\./)

    const section = screen.getByRole("region", { name: /required total/i })
    expect(within(section).getByText("Including your age coefficient")).toBeInTheDocument()

    await user.type(within(section).getByLabelText("Desired score"), "500")

    expect(await within(section).findByText("÷ 1.066 at age 50")).toBeInTheDocument()
    const input = toDotsInput(dotsFormSchema.parse({ ...REFERENCE, age: "50" }))
    const expected = calculateRequiredTotal({ ...input, kind: "dots", score: 500 })
    const plain = formatNumber(kgToLb(expected.totalKg), 0)
    const adjusted = formatNumber(kgToLb(expected.ageAdjusted!.totalKg), 0)
    expect(await within(section).findByText(plain, { selector: ".sr-only" })).toBeInTheDocument()
    expect(within(section).getByText(adjusted, { selector: ".sr-only" })).toBeInTheDocument()
    expect(plain).not.toBe(adjusted)
  })

  it("flags a target score outside the accepted range", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await calculate(user)
    await screen.findByText(SCORES)

    await user.type(screen.getByLabelText("Desired score"), "2000")
    expect(await screen.findByText("Score must be 1–1,500")).toBeInTheDocument()
  })

  it("notes when the bodyweight is outside the DOTS range", async () => {
    const user = renderCalculator()
    await user.type(screen.getByLabelText("Bodyweight"), "80")
    await user.type(screen.getByLabelText("Age"), "30")
    await user.click(screen.getByRole("radio", { name: "Female" }))
    await user.type(screen.getByLabelText("Total"), "300")
    await calculate(user)

    expect(await screen.findByText(/DOTS is defined for 40–150 kg\./)).toBeInTheDocument()
    expect(screen.getByText("Bodyweight (clamped)")).toBeInTheDocument()
  })
})

describe("DotsCalculator account prompts", () => {
  it("asks signed-out visitors to sign up", () => {
    renderCalculator({ accountState: "signed-out" })
    expect(screen.getByText("Create an account to save your metrics")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /sign up/i })).toHaveAttribute("href", "/sign-up")
  })

  it("asks signed-in users without a profile to set one up", () => {
    renderCalculator({ accountState: "needs-profile" })
    expect(screen.getByRole("link", { name: /set up profile/i })).toHaveAttribute(
      "href",
      "/onboarding",
    )
  })

  it("shows no prompt once the profile exists", () => {
    renderCalculator()
    expect(screen.queryByText(/your metrics/)).toBeNull()
  })
})

describe("DotsCalculator with a saved profile", () => {
  // Toasts live in a module-level store that outlasts each render.
  afterEach(() => {
    toast.dismiss()
  })

  const PROFILE: DotsFormInput = { ...DOTS_FORM_DEFAULTS, weight: "205", age: "30", sex: "male" }

  function renderWithToaster(props: React.ComponentProps<typeof DotsCalculator> = {}) {
    const user = userEvent.setup()
    render(
      <MotionProvider>
        <DotsCalculator {...props} />
        <Toaster />
      </MotionProvider>,
    )
    return user
  }

  it("fills the form from the profile and says so", async () => {
    const user = renderWithToaster({ initialValues: PROFILE })

    expect(screen.getByLabelText("Bodyweight")).toHaveValue("205")
    expect(screen.getByLabelText("Age")).toHaveValue("30")
    expect(screen.getByLabelText("Total")).toHaveValue("")

    expect(
      await screen.findByText("Information was autofilled from your profile"),
    ).toBeInTheDocument()

    await user.type(screen.getByLabelText("Total"), "1543")
    await calculate(user)
    expect(await screen.findByText(SCORES)).toBeInTheDocument()
  })

  it("mentions the PR tracker when the total came from it", async () => {
    renderWithToaster({ initialValues: { ...PROFILE, total: "1543" }, totalFromPrs: true })

    expect(screen.getByLabelText("Total")).toHaveValue("1543")
    expect(
      await screen.findByText("Information was autofilled from your profile and PR tracker"),
    ).toBeInTheDocument()
    expect(screen.getByText(/best squat, bench and deadlift 1RMs/)).toBeInTheDocument()
  })

  it("links the notification to settings", async () => {
    const user = renderWithToaster({ initialValues: PROFILE })
    const settings = await screen.findByRole("button", { name: "Settings" })
    // Sonner hands focus back to the previously focused element on dismiss.
    screen.getByLabelText("Bodyweight").focus()
    await user.click(settings)
    expect(useRouter().push).toHaveBeenCalledWith("/profile")
  })

  it("doesn't mention autofill for signed-out visitors", async () => {
    renderWithToaster({ accountState: "signed-out" })
    await screen.findByRole("button", { name: /calculate scores/i })
    expect(screen.queryByText(/autofilled from your profile/)).toBeNull()
  })
})
