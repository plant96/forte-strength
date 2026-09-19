import { render, screen, within } from "@testing-library/react"
import userEvent, { type UserEvent } from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { MotionProvider } from "@/components/motion/motion-provider"

import { TdeeCalculator } from "./tdee-calculator"

function renderCalculator() {
  const user = userEvent.setup()
  render(
    <MotionProvider>
      <TdeeCalculator />
    </MotionProvider>,
  )
  return user
}

/** 180 lb, 5'10", 30 y male, 15% body fat, 8,000 steps, 4 moderate sessions. */
async function fillReferenceInputs(user: UserEvent) {
  await user.type(screen.getByLabelText("Bodyweight"), "180")
  await user.type(screen.getByLabelText("Height"), "5")
  await user.type(screen.getByLabelText("Inches"), "10")
  await user.type(screen.getByLabelText("Age"), "30")
  await user.click(screen.getByRole("radio", { name: "Male" }))
  await user.type(screen.getByLabelText("Body fat"), "15")
  await user.type(screen.getByLabelText("Average daily steps"), "8000")
  await user.type(screen.getByLabelText("Training sessions per week"), "4")
  await user.click(screen.getByLabelText("Training intensity"))
  await user.click(await screen.findByRole("option", { name: "Moderate" }))
}

describe("TdeeCalculator", () => {
  it("shows validation errors instead of results when fields are empty", async () => {
    const user = renderCalculator()
    await user.click(screen.getByRole("button", { name: /calculate tdee/i }))

    expect(await screen.findByText("Enter your weight")).toBeInTheDocument()
    expect(screen.getByText("Select your sex")).toBeInTheDocument()
    expect(screen.getByText("Your results will appear here")).toBeInTheDocument()
  })

  it("calculates TDEE and shows four bulk and four cut targets", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await user.click(screen.getByRole("button", { name: /calculate tdee/i }))

    expect(await screen.findByText("Estimated TDEE: 2,843 calories per day.")).toBeInTheDocument()
    expect(screen.getAllByText("kcal/day")).toHaveLength(8)

    const bulk = screen.getByRole("region", { name: "Bulk" })
    const cut = screen.getByRole("region", { name: "Cut" })
    expect(within(bulk).getByText("+0.25 lb/week")).toBeInTheDocument()
    expect(within(bulk).getByText("+2 lb/week")).toBeInTheDocument()
    expect(within(cut).getByText("−0.5 lb/week")).toBeInTheDocument()
    // TDEE 2,842.7 − 250 kcal
    expect(within(cut).getByText("2,593", { selector: ".sr-only" })).toBeInTheDocument()
  })

  it("switches the targets to kg presets", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await user.click(screen.getByRole("button", { name: /calculate tdee/i }))
    await screen.findByText("Estimated TDEE: 2,843 calories per day.")

    await user.click(screen.getByRole("radio", { name: "kg" }))

    const cut = screen.getByRole("region", { name: "Cut" })
    expect(within(cut).getByText("−0.1 kg/week")).toBeInTheDocument()
    expect(within(cut).getByText("−1 kg/week")).toBeInTheDocument()
  })

  it("updates results live after the first calculation", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await user.click(screen.getByRole("button", { name: /calculate tdee/i }))
    await screen.findByText("Estimated TDEE: 2,843 calories per day.")

    await user.click(screen.getByRole("button", { name: "One fewer session" }))

    expect(screen.queryByText("Estimated TDEE: 2,843 calories per day.")).not.toBeInTheDocument()
    expect(screen.getByText(/^Estimated TDEE: [\d,]+ calories per day\.$/)).toBeInTheDocument()
  })

  it("opens the calculation panel with the same numbers", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await user.click(screen.getByRole("button", { name: /calculate tdee/i }))
    await screen.findByText("Estimated TDEE: 2,843 calories per day.")

    await user.click(screen.getByRole("button", { name: /view the calculations/i }))

    const panel = await screen.findByRole("dialog", { name: "How your TDEE was calculated" })
    expect(await within(panel).findByText("81.65 kg")).toBeInTheDocument()
    expect(within(panel).getByText("177.8 cm")).toBeInTheDocument()
    for (const value of ["1,865.1", "1,782.7", "1,869.0", "1,839.0", "1.5458", "2,842.7"]) {
      expect(within(panel).getAllByText(value).length).toBeGreaterThan(0)
    }
    expect(within(panel).getByRole("heading", { name: "Variables" })).toBeInTheDocument()
    expect(within(panel).getByRole("heading", { name: "Macronutrients" })).toBeInTheDocument()
  })

  it("notes that TEF isn't included and explains it on request", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await user.click(screen.getByRole("button", { name: /calculate tdee/i }))
    await screen.findByText("Estimated TDEE: 2,843 calories per day.")

    expect(screen.getByText(/^Doesn't include the thermic effect of food/)).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "What is TEF?" }))
    const dialog = await screen.findByRole("dialog", { name: "What is TEF?" })
    expect(within(dialog).getByText(/digesting, absorbing and processing/)).toBeInTheDocument()
    expect(within(dialog).getByText(/differs from athlete to athlete/)).toBeInTheDocument()
    expect(within(dialog).getByText("20–30% of its calories")).toBeInTheDocument()
    // No single fixed TEF percentage anywhere in the explanation.
    expect(dialog).not.toHaveTextContent(/about 10%|roughly 10%/i)
    expect(within(dialog).getByText("Non-exercise activity thermogenesis")).toBeInTheDocument()
    expect(within(dialog).getByText("Exercise activity thermogenesis")).toBeInTheDocument()
  })

  it("describes the chosen intensity and highlights it in the reference", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)

    expect(
      screen.getByText("Resistance training with free weights, or Zone 3 cardio."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Reference" }))
    const guide = await screen.findByRole("dialog", { name: "Training intensity guide" })
    expect(within(guide).getByText("HYROX")).toBeInTheDocument()
    // The step-overlap note sits with the general notes at the bottom, not in the Very light card.
    expect(within(guide).getByText(/corrects for the overlap/)).toBeInTheDocument()
    const veryLight = within(guide).getByRole("heading", { name: "Very light" }).closest("li")
    expect(veryLight).not.toHaveTextContent(/corrects for the overlap/)
    const selected = within(guide).getByText("Your selection").closest("li")
    expect(selected).toHaveTextContent("Moderate")
  })

  it("shows three macro splits and rebuilds them from the chosen calorie target", async () => {
    const user = renderCalculator()
    await fillReferenceInputs(user)
    await user.click(screen.getByRole("button", { name: /calculate tdee/i }))
    await screen.findByText("Estimated TDEE: 2,843 calories per day.")

    const macros = screen.getByRole("region", { name: /your macros/i })
    for (const name of ["Standard", "High protein", "High carb"]) {
      expect(within(macros).getByRole("article", { name })).toBeInTheDocument()
    }
    const highCarb = within(macros).getByRole("article", { name: "High carb" })
    expect(within(highCarb).getByText("Coach Ty's favorite")).toBeInTheDocument()

    // Standard protein at maintenance: 2,842.7 × 27.5% ÷ 4 ≈ 195 g
    const standard = within(macros).getByRole("article", { name: "Standard" })
    expect(within(standard).getByText("195", { selector: ".sr-only" })).toBeInTheDocument()

    await user.click(screen.getByLabelText("Calorie target"))
    await user.click(await screen.findByRole("option", { name: "Cut −0.5 lb/week · 2,593 kcal" }))

    // 2,592.7 × 27.5% ÷ 4 ≈ 178 g
    expect(within(standard).getByText("178", { selector: ".sr-only" })).toBeInTheDocument()
  })
})
