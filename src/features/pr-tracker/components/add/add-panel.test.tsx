import { render, screen, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  createExercise: vi.fn(),
  loadExerciseSeries: vi.fn(),
  discardEmptyExercise: vi.fn(),
  addPrEntry: vi.fn(),
}))

vi.mock("../../actions", () => ({
  createExercise: mocks.createExercise,
  loadExerciseSeries: mocks.loadExerciseSeries,
  discardEmptyExercise: mocks.discardEmptyExercise,
  addPrEntry: mocks.addPrEntry,
}))

import { AddPanel } from "./add-panel"

const BENCH = { id: "ex-1", name: "Bench Press", slug: "bench-press" }
const PREFILL = { movement: "Bench Press", series: { kind: "rep" as const, sets: 1, reps: 2 } }

function setup() {
  return render(
    <AddPanel exercises={[]} unit="lb" basePath="/tools/pr-tracker" prefill={PREFILL} />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.loadExerciseSeries.mockResolvedValue([])
  window.history.replaceState(
    null,
    "",
    "/tools/pr-tracker?panel=add&movement=Bench%20Press&series=2rep",
  )
})

describe("AddPanel prefill", () => {
  it("resolves the movement, selects the PR type and opens the lift step", async () => {
    mocks.createExercise.mockResolvedValue({ ok: true, status: "reused", exercise: BENCH })
    setup()

    expect(screen.getByRole("status")).toHaveTextContent(/Setting up Bench Press/)

    // Step 01 collapses to the picked movement …
    expect(await screen.findByRole("button", { name: "Change" })).toBeInTheDocument()
    expect(mocks.createExercise).toHaveBeenCalledWith({ name: "Bench Press", athleteId: undefined })
    expect(mocks.loadExerciseSeries).toHaveBeenCalledWith("bench-press", undefined)
    // … step 02 shows the 2-rep choice as selected …
    expect(await screen.findByText("Selected")).toBeInTheDocument()
    expect(screen.getByText("2 reps")).toBeInTheDocument()
    // … and step 03 (weight and date) is open.
    expect(await screen.findByText("The lift")).toBeInTheDocument()

    await waitFor(() => expect(window.location.search).toBe("?panel=add"))
  })

  it("continues the closest existing movement when the name is a near-duplicate", async () => {
    mocks.createExercise
      .mockResolvedValueOnce({
        ok: false,
        status: "confirm",
        typed: "Bench Press",
        suggestions: [{ name: "Benchpress" }],
      })
      .mockResolvedValueOnce({
        ok: true,
        status: "reused",
        exercise: { id: "ex-2", name: "Benchpress", slug: "benchpress" },
      })
    setup()

    expect(await screen.findByRole("button", { name: "Change" })).toBeInTheDocument()
    expect(mocks.createExercise).toHaveBeenLastCalledWith({
      name: "Benchpress",
      athleteId: undefined,
    })
    expect(await screen.findByText("The lift")).toBeInTheDocument()
  })

  it("falls back to the picker when the movement can't be resolved", async () => {
    mocks.createExercise.mockResolvedValue({ ok: false, status: "error", message: "Nope" })
    setup()

    expect(await screen.findByRole("combobox", { name: "Movement" })).toBeInTheDocument()
    expect(screen.queryByText("The lift")).not.toBeInTheDocument()
  })
})
