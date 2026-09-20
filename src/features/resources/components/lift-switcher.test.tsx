import { render, screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { LiftSwitcher, type LiftTab } from "./lift-switcher"

// The switcher reads the lift from the segment below the vault layout.
vi.mock("next/navigation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("next/navigation")>()),
  useSelectedLayoutSegment: () => "bench",
}))

const lifts: LiftTab[] = [
  { slug: "squat", title: "Squat", href: "/resources/mobility-vault/squat" },
  { slug: "bench", title: "Bench", href: "/resources/mobility-vault/bench" },
  { slug: "deadlift", title: "Deadlift", href: "/resources/mobility-vault/deadlift" },
]

describe("LiftSwitcher", () => {
  it("links every lift and marks only the active one as current", () => {
    render(<LiftSwitcher lifts={lifts} />)

    const squat = screen.getByRole("link", { name: "Squat" })
    const bench = screen.getByRole("link", { name: "Bench" })
    const deadlift = screen.getByRole("link", { name: "Deadlift" })

    expect(squat).toHaveAttribute("href", "/resources/mobility-vault/squat")
    expect(bench).toHaveAttribute("href", "/resources/mobility-vault/bench")
    expect(deadlift).toHaveAttribute("href", "/resources/mobility-vault/deadlift")

    expect(bench).toHaveAttribute("aria-current", "page")
    expect(squat).not.toHaveAttribute("aria-current")
    expect(deadlift).not.toHaveAttribute("aria-current")
  })
})
