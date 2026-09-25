import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MotionProvider } from "@/components/motion/motion-provider"

import { SAMPLE_ATHLETES } from "../lib/fixtures"
import { LiftLeaderboard } from "./lift-leaderboard"

function renderBoard(overrides: Partial<React.ComponentProps<typeof LiftLeaderboard>> = {}) {
  const onUnitChange = vi.fn()
  const user = userEvent.setup()
  render(
    <MotionProvider>
      <LiftLeaderboard
        athletes={SAMPLE_ATHLETES}
        viewerId="a-ben"
        unavailable={false}
        unit="kg"
        onUnitChange={onUnitChange}
        initialFilters={{ ageGroup: "open", weightClass: "83", lift: "squat" }}
        {...overrides}
      />
    </MotionProvider>,
  )
  return { user, onUnitChange }
}

const generate = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole("button", { name: /generate leaderboard/i }))

const rows = () =>
  within(screen.getByRole("list", { name: "Ranked lifters" })).getAllByRole("listitem")

describe("LiftLeaderboard", () => {
  it("waits for the first generate", () => {
    renderBoard()
    expect(screen.getByText("Your board will appear here")).toBeInTheDocument()
    expect(screen.queryByRole("list", { name: "Ranked lifters" })).toBeNull()
    expect(screen.queryByText(/update as you change/)).toBeNull()
  })

  it("ranks the open 82.5–83 kg squats with the viewer marked", async () => {
    const { user } = renderBoard()
    await generate(user)

    const list = await screen.findByRole("list", { name: "Ranked lifters" })
    const items = within(list).getAllByRole("listitem")
    expect(items.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Ben O."),
      expect.stringContaining("Jordan O."),
      expect.stringContaining("Omar H."),
    ])
    expect(within(items[0]!).getByText("You")).toBeInTheDocument()
    expect(within(items[0]!).getByText("Rank 1")).toBeInTheDocument()
    expect(within(items[0]!).getByText("230", { selector: ".sr-only" })).toBeInTheDocument()
    expect(screen.getByText("3 lifters")).toBeInTheDocument()
    expect(screen.getByText("Results now update as you change the filters.")).toBeInTheDocument()
  })

  it("follows the lift toggle live after generating", async () => {
    const { user } = renderBoard()
    await generate(user)
    await screen.findByRole("list", { name: "Ranked lifters" })

    await user.click(screen.getByRole("radio", { name: "Bench" }))

    expect(await screen.findByText("2 lifters")).toBeInTheDocument()
    expect(rows().map((item) => item.textContent)).toEqual([
      expect.stringContaining("Jordan O."),
      expect.stringContaining("Omar H."),
    ])
    // Ben has no bench logged, so his "You" badge is gone.
    expect(screen.queryByText("You")).toBeNull()
  })

  it("follows the age group and weight class selects", async () => {
    const { user } = renderBoard()
    await generate(user)
    await screen.findByRole("list", { name: "Ranked lifters" })

    await user.click(screen.getByLabelText("Age group"))
    await user.click(await screen.findByRole("option", { name: "Masters (40+)" }))
    expect(await screen.findByText("No lifters in this class yet")).toBeInTheDocument()
    expect(screen.getByText(/squat 1RM logged in Masters \(40\+\), 82.5–83 kg/)).toBeInTheDocument()

    await user.click(screen.getByLabelText("Weight class"))
    await user.click(await screen.findByRole("option", { name: "100–110 kg" }))
    expect(await screen.findByText("1 lifter")).toBeInTheDocument()
    expect(rows()[0]).toHaveTextContent("Sam W.")
  })

  it("never lists a lifter under 14", async () => {
    const { user } = renderBoard({
      initialFilters: { ageGroup: "teen1", weightClass: "59", lift: "squat" },
    })
    await generate(user)
    expect(await screen.findByText("No lifters in this class yet")).toBeInTheDocument()
    expect(screen.queryByText("Mia C.")).toBeNull()
  })

  it("shows weights in the chosen unit and offers the toggle", async () => {
    const { user, onUnitChange } = renderBoard({ unit: "lb" })
    await generate(user)
    await screen.findByRole("list", { name: "Ranked lifters" })

    // 230 kg is 507.1 lb.
    expect(within(rows()[0]!).getByText("507.1", { selector: ".sr-only" })).toBeInTheDocument()
    await user.click(screen.getByRole("radio", { name: "kg" }))
    expect(onUnitChange).toHaveBeenCalledWith("kg")
  })

  it("explains an unavailable database instead of claiming an empty class", async () => {
    const { user } = renderBoard({ athletes: [], unavailable: true })
    await generate(user)
    expect(await screen.findByText("Leaderboard unavailable")).toBeInTheDocument()
  })
})
