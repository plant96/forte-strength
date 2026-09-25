import { describe, expect, it } from "vitest"

import { SAMPLE_ATHLETES, sampleAthlete } from "./fixtures"
import { rankByDots, rankByLift, viewerDotsPosition } from "./rankings"

describe("rankByDots", () => {
  const top = rankByDots(SAMPLE_ATHLETES)

  it("ranks the best DOTS first and stops at ten", () => {
    expect(top).toHaveLength(10)
    expect(top.map((entry) => entry.rank)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
    for (let index = 1; index < top.length; index++) {
      expect(top[index - 1]!.dots).toBeGreaterThanOrEqual(top[index]!.dots)
    }
  })

  it("leaves out anyone missing a lift", () => {
    const everyone = rankByDots(SAMPLE_ATHLETES, Infinity)
    expect(everyone).toHaveLength(13)
    expect(everyone.some((entry) => entry.athlete.id === "a-ben")).toBe(false)
  })

  it("breaks a DOTS tie by the heavier total, then the name", () => {
    const base = { sex: "male" as const, age: 30, bw: 90, squat: 200, bench: 120, deadlift: 250 }
    const zed = sampleAthlete({ id: "z", first: "Zed", last: "A", ...base })
    const amy = sampleAthlete({ id: "a", first: "Amy", last: "B", ...base })
    const heavier = sampleAthlete({
      id: "h",
      first: "Bea",
      last: "C",
      ...base,
      bw: 93,
      squat: 205,
      bench: 122,
      deadlift: 251,
    })
    // Same total & bodyweight → identical DOTS; Amy sorts before Zed by name.
    const ranked = rankByDots([zed, amy])
    expect(ranked.map((entry) => entry.athlete.id)).toEqual(["a", "z"])
    // A heavier total at the same score would win: force the tie by copying the score.
    const tied = { ...heavier, dots: amy.dots }
    expect(rankByDots([amy, tied]).map((entry) => entry.athlete.id)).toEqual(["h", "a"])
  })
})

describe("viewerDotsPosition", () => {
  it("finds a viewer outside the top ten", () => {
    const position = viewerDotsPosition(SAMPLE_ATHLETES, "a-ava")
    expect(position?.rank).toBeGreaterThan(10)
    expect(position?.athlete.name).toBe("Ava L.")
  })

  it("is null for unknown or unqualified viewers", () => {
    expect(viewerDotsPosition(SAMPLE_ATHLETES, null)).toBeNull()
    expect(viewerDotsPosition(SAMPLE_ATHLETES, "nobody")).toBeNull()
    expect(viewerDotsPosition(SAMPLE_ATHLETES, "a-ben")).toBeNull()
  })
})

describe("rankByLift", () => {
  it("lists the open 82.5–83 kg squats, lighter lifter first on a tie", () => {
    const ranked = rankByLift(SAMPLE_ATHLETES, {
      ageGroup: "open",
      weightClass: "83",
      lift: "squat",
    })
    expect(ranked.map((entry) => [entry.rank, entry.athlete.name, entry.kg])).toEqual([
      [1, "Ben O.", 230],
      [2, "Jordan O.", 230],
      [3, "Omar H.", 210],
    ])
  })

  it("includes lifters without a full total and skips the lift they lack", () => {
    const squats = rankByLift(SAMPLE_ATHLETES, {
      ageGroup: "open",
      weightClass: "83",
      lift: "squat",
    })
    expect(squats.some((entry) => entry.athlete.id === "a-ben")).toBe(true)
    const benches = rankByLift(SAMPLE_ATHLETES, {
      ageGroup: "open",
      weightClass: "83",
      lift: "bench",
    })
    expect(benches.some((entry) => entry.athlete.id === "a-ben")).toBe(false)
  })

  it("never lists a lifter under 14", () => {
    for (const ageGroup of ["teen1", "teen2", "teen3", "junior", "open", "masters"] as const) {
      const ranked = rankByLift(SAMPLE_ATHLETES, { ageGroup, weightClass: "59", lift: "squat" })
      expect(ranked.some((entry) => entry.athlete.id === "a-mia")).toBe(false)
    }
  })

  it("is empty when nobody fits", () => {
    expect(
      rankByLift(SAMPLE_ATHLETES, { ageGroup: "teen1", weightClass: "110+", lift: "deadlift" }),
    ).toEqual([])
  })

  it("breaks an exact tie by the earlier date, then the name", () => {
    const base = { sex: "female" as const, age: 30, bw: 60, squat: 120 }
    const later = sampleAthlete({ id: "l", first: "Lia", last: "K", ...base })
    const earlier = {
      ...sampleAthlete({ id: "e", first: "Zoe", last: "K", ...base }),
      lifts: { squat: { kg: 120, achievedOn: "2026-01-01" } },
    }
    const ranked = rankByLift([later, earlier], {
      ageGroup: "open",
      weightClass: "67.5",
      lift: "squat",
    })
    expect(ranked.map((entry) => entry.athlete.id)).toEqual(["e", "l"])
  })
})
