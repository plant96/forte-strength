import { describe, expect, it } from "vitest"

import { bestLiftAddHref, classifyCompetitionLift } from "./lifts"

describe("bestLiftAddHref", () => {
  it("starts the catalogue lift when nothing in the row is tracked", () => {
    expect(bestLiftAddHref("bench", 2)).toBe(
      "/tools/pr-tracker?panel=add&movement=Bench%20Press&series=2rep",
    )
    expect(bestLiftAddHref("squat", 1)).toBe(
      "/tools/pr-tracker?panel=add&movement=Squat&series=1rm",
    )
  })

  it("continues the movement already tracked in that row", () => {
    expect(bestLiftAddHref("deadlift", 3, "Sumo Deadlift")).toBe(
      "/tools/pr-tracker?panel=add&movement=Sumo%20Deadlift&series=3rep",
    )
  })
})

describe("classifyCompetitionLift", () => {
  it.each([
    ["BENCH", "bench"],
    ["bENCH", "bench"],
    ["bench", "bench"],
    ["Bench Press", "bench"],
    ["bench-press", "bench"],
    ["Comp Bench", "bench"],
    ["Flat Bench", "bench"],
    ["Squat", "squat"],
    ["SQUAT", "squat"],
    ["squats", "squat"],
    ["Back Squat", "squat"],
    ["BACK SQUAT", "squat"],
    ["Low Bar Squat", "squat"],
    ["Competition Squat", "squat"],
    ["deadlift", "deadlift"],
    ["Deadlifts", "deadlift"],
    ["DL", "deadlift"],
    ["Conventional Deadlift", "deadlift"],
    ["Sumo Deadlift", "deadlift"],
    ["sumo", "deadlift"],
  ])("matches %s as %s", (name, lift) => {
    expect(classifyCompetitionLift(name)).toBe(lift)
  })

  it.each([
    "Front Squat",
    "Paused Bench",
    "Paused Bench Press",
    "Incline Bench Press",
    "Close Grip Bench Press",
    "Romanian Deadlift",
    "RDL",
    "Deficit Deadlift",
    "Leg Press",
    "Overhead Press",
    "Squat (belt)",
    "Bulgarian Split Squat",
    "",
    "   ",
  ])("ignores %s", (name) => {
    expect(classifyCompetitionLift(name)).toBeNull()
  })
})
