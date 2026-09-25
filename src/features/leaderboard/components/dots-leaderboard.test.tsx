import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { MotionProvider } from "@/components/motion/motion-provider"
import { formatWeight } from "@/features/pr-tracker/lib/weight"
import { formatNumber } from "@/lib/breakdown/format"

import { SAMPLE_ATHLETES, SAMPLE_VIEWER_ID } from "../lib/fixtures"
import { rankByDots, viewerDotsPosition } from "../lib/rankings"
import { DotsLeaderboard } from "./dots-leaderboard"

const rankings = rankByDots(SAMPLE_ATHLETES)
const qualifiedCount = rankByDots(SAMPLE_ATHLETES, Infinity).length

function renderBoard(overrides: Partial<React.ComponentProps<typeof DotsLeaderboard>> = {}) {
  const onUnitChange = vi.fn()
  const user = userEvent.setup()
  render(
    <MotionProvider>
      <DotsLeaderboard
        rankings={rankings}
        you={viewerDotsPosition(SAMPLE_ATHLETES, SAMPLE_VIEWER_ID)}
        qualifiedCount={qualifiedCount}
        viewerId={SAMPLE_VIEWER_ID}
        viewerIsClient
        unavailable={false}
        unit="kg"
        onUnitChange={onUnitChange}
        {...overrides}
      />
    </MotionProvider>,
  )
  return { user, onUnitChange }
}

describe("DotsLeaderboard", () => {
  it("puts the top three on the podium in rank order and the rest in a list", () => {
    renderBoard()

    const podium = within(screen.getByRole("list", { name: "Podium" })).getAllByRole("listitem")
    expect(podium).toHaveLength(3)
    podium.forEach((tile, index) => {
      expect(tile).toHaveTextContent(rankings[index]!.athlete.name)
      expect(within(tile).getByText(`Rank ${index + 1}`)).toBeInTheDocument()
    })

    const rest = within(screen.getByRole("list", { name: "Ranks 4 to 10" })).getAllByRole(
      "listitem",
    )
    expect(rest).toHaveLength(7)
    expect(rest[0]).toHaveTextContent(rankings[3]!.athlete.name)
    expect(within(rest[6]!).getByText("Rank 10")).toBeInTheDocument()
  })

  it("shows each DOTS score and the total in the chosen unit", () => {
    renderBoard()
    const leader = rankings[0]!
    expect(
      screen.getAllByText(formatNumber(leader.dots, 2), { selector: ".sr-only" }).length,
    ).toBeGreaterThan(0)
    expect(screen.getByText(`${formatWeight(leader.totalKg, "kg")} total`)).toBeInTheDocument()
  })

  it("tells a viewer outside the top ten where they stand", () => {
    renderBoard()
    const you = viewerDotsPosition(SAMPLE_ATHLETES, SAMPLE_VIEWER_ID)!
    expect(you.rank).toBeGreaterThan(10)
    expect(
      screen.getByText(
        `You're #${you.rank} of ${qualifiedCount} · ${formatNumber(you.dots, 2)} DOTS`,
      ),
    ).toBeInTheDocument()
    expect(screen.queryByText("You")).toBeNull()
  })

  it("marks the viewer's own row inside the top ten", () => {
    const fifth = rankings[4]!.athlete.id
    renderBoard({ viewerId: fifth, you: viewerDotsPosition(SAMPLE_ATHLETES, fifth) })
    const badge = screen.getByText("You")
    expect(badge.closest("li")).toHaveTextContent(rankings[4]!.athlete.name)
    expect(screen.queryByText(/You're #/)).toBeNull()
  })

  it("switches units through the toggle", async () => {
    const { user, onUnitChange } = renderBoard()
    await user.click(screen.getByRole("radio", { name: "lb" }))
    expect(onUnitChange).toHaveBeenCalledWith("lb")
  })

  it("invites a client with no scores to log their lifts", () => {
    renderBoard({ rankings: [], you: null, qualifiedCount: 0 })
    expect(screen.getByText("No DOTS scores yet")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /log a pr/i })).toHaveAttribute(
      "href",
      "/tools/pr-tracker?panel=add",
    )
  })

  it("keeps visitors' empty state free of client actions", () => {
    renderBoard({
      rankings: [],
      you: null,
      qualifiedCount: 0,
      viewerIsClient: false,
      viewerId: null,
    })
    expect(screen.getByText("The board is warming up")).toBeInTheDocument()
    expect(screen.queryByRole("link", { name: /log a pr/i })).toBeNull()
  })

  it("says so when the database couldn't be read", () => {
    renderBoard({ rankings: [], you: null, qualifiedCount: 0, unavailable: true })
    expect(screen.getByText("Leaderboard unavailable")).toBeInTheDocument()
  })
})
