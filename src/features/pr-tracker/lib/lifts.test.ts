import { describe, expect, it } from "vitest"

import { classifyCompetitionLift } from "./lifts"

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
