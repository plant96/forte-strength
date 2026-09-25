import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { MotionProvider } from "@/components/motion/motion-provider"
import { lbToKg } from "@/lib/units"

import type { FeedPr } from "../lib/feed"
import { PrFeed } from "./pr-feed"

const PRS: FeedPr[] = [
  {
    id: "a",
    name: "Jim R.",
    mine: false,
    lift: "bench",
    shape: { kind: "rep", sets: 1, reps: 4 },
    weightKg: lbToKg(240),
    gainKg: lbToKg(10),
    achievedOn: "2020-01-10",
  },
  {
    id: "b",
    name: "Jon K.",
    mine: false,
    lift: "squat",
    shape: { kind: "one-rep-max", sets: 1, reps: 1 },
    weightKg: lbToKg(400),
    gainKg: null,
    achievedOn: "2020-01-09",
  },
  {
    id: "c",
    name: "Sam T.",
    mine: true,
    lift: "deadlift",
    shape: { kind: "volume", sets: 5, reps: 5 },
    weightKg: lbToKg(315),
    gainKg: null,
    achievedOn: "2020-01-08",
  },
]

function renderFeed(prs: FeedPr[] = PRS) {
  const user = userEvent.setup()
  render(
    <MotionProvider>
      <PrFeed prs={prs} unit="lb" />
    </MotionProvider>,
  )
  return user
}

const slide = (name: string) => screen.findByRole("group", { name })

describe("PrFeed", () => {
  it("opens on the newest PR, with its type and gain", async () => {
    renderFeed()
    expect(await slide("1 of 3")).toBeInTheDocument()
    expect(screen.getByText("Jim R. hit 240 lb on bench for 4 reps")).toBeInTheDocument()
    expect(screen.getByText("4-Rep PR")).toBeInTheDocument()
    expect(screen.getByText("+10 lb")).toBeInTheDocument()
  })

  it("steps forward and back, wrapping at both ends", async () => {
    const user = renderFeed()
    const next = screen.getByRole("button", { name: "Next PR" })
    const previous = screen.getByRole("button", { name: "Previous PR" })

    await user.click(next)
    expect(await slide("2 of 3")).toBeInTheDocument()
    expect(await screen.findByText("Jon K. hit 400 lb on squat for a new max")).toBeInTheDocument()

    await user.click(next)
    expect(await screen.findByText("You hit 315 lb on deadlift for 5×5")).toBeInTheDocument()

    await user.click(next)
    expect(await slide("1 of 3")).toBeInTheDocument()

    await user.click(previous)
    expect(await slide("3 of 3")).toBeInTheDocument()
  })

  it("steps with the arrow keys", async () => {
    const user = renderFeed()
    screen.getByRole("button", { name: "Next PR" }).focus()

    await user.keyboard("{ArrowRight}")
    expect(await slide("2 of 3")).toBeInTheDocument()
    await user.keyboard("{ArrowLeft}")
    expect(await slide("1 of 3")).toBeInTheDocument()
  })

  it("pauses and plays", async () => {
    const user = renderFeed()
    await user.click(screen.getByRole("button", { name: "Pause feed" }))
    expect(screen.getByRole("button", { name: "Play feed" })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Play feed" }))
    expect(screen.getByRole("button", { name: "Pause feed" })).toBeInTheDocument()
  })

  it("shows a single PR without controls", async () => {
    renderFeed([PRS[0]!])
    expect(await slide("1 of 1")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: "Next PR" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Pause feed" })).toBeNull()
  })

  it("invites the first PR when the team has none", () => {
    renderFeed([])
    expect(screen.getByText("No team PRs yet")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /log a pr/i })).toHaveAttribute(
      "href",
      "/tools/pr-tracker?panel=add",
    )
  })
})
