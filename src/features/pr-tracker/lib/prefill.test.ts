import { describe, expect, it } from "vitest"

import { addPrefillHref, parseAddPrefill } from "./prefill"

describe("parseAddPrefill", () => {
  it("reads a movement name and a series key", () => {
    expect(parseAddPrefill("Bench Press", "2rep")).toEqual({
      movement: "Bench Press",
      series: { kind: "rep", sets: 1, reps: 2 },
    })
    expect(parseAddPrefill("  squat  ", "1rm")).toEqual({
      movement: "squat",
      series: { kind: "one-rep-max", sets: 1, reps: 1 },
    })
  })

  it("takes the first value when a param repeats", () => {
    expect(parseAddPrefill(["Deadlift", "Squat"], ["3rep", "1rm"])?.movement).toBe("Deadlift")
  })

  it("rejects anything incomplete or malformed", () => {
    expect(parseAddPrefill(undefined, "1rm")).toBeNull()
    expect(parseAddPrefill("Squat", undefined)).toBeNull()
    expect(parseAddPrefill("Squat", "5x5x5")).toBeNull()
    expect(parseAddPrefill("Squat", "1rep")).toBeNull()
    expect(parseAddPrefill("x".repeat(61), "1rm")).toBeNull()
  })
})

describe("addPrefillHref", () => {
  it("encodes the movement and names the series", () => {
    expect(
      addPrefillHref("/tools/pr-tracker", "Bench Press", { kind: "rep", sets: 1, reps: 3 }),
    ).toBe("/tools/pr-tracker?panel=add&movement=Bench%20Press&series=3rep")
  })

  it("round-trips through the parser", () => {
    const href = addPrefillHref("/x", "Sumo Deadlift", { kind: "one-rep-max", sets: 1, reps: 1 })
    const url = new URL(href, "https://forte.test")
    expect(
      parseAddPrefill(
        url.searchParams.get("movement") ?? undefined,
        url.searchParams.get("series") ?? undefined,
      ),
    ).toEqual({ movement: "Sumo Deadlift", series: { kind: "one-rep-max", sets: 1, reps: 1 } })
  })
})
