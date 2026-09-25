import { beforeEach, describe, expect, it, vi } from "vitest"

import { emptyBestLifts, type BestLift } from "@/features/pr-tracker/lib/lifts"
import type { Viewer } from "@/features/profile/queries"

const mocks = vi.hoisted(() => ({ getBestLifts: vi.fn() }))

vi.mock("@/features/pr-tracker/queries", () => ({ getBestLifts: mocks.getBestLifts }))

import { getDotsAutofill } from "./queries"

const PROFILE: NonNullable<Viewer["profile"]> = {
  birthDate: new Date("1995-06-15T00:00:00.000Z"),
  sex: "FEMALE",
  weight: 63,
  weightUnit: "KG",
  heightCm: 168,
  heightUnit: "CM",
  bodyFatPercent: 24,
  stepsPerDay: 8000,
  sessionsPerWeek: 4,
  intensity: "MODERATE",
}

const CLIENT: Viewer = {
  id: "user-1",
  accountState: "complete",
  client: true,
  unlocked: true,
  profile: PROFILE,
  liftUnit: "kg",
}

const lift = (weightKg: number): BestLift => ({
  weightKg,
  exerciseName: "Lift",
  achievedOn: "2026-06-01",
  href: "/tools/pr-tracker/lift/1rm",
})

function bestLifts(squat: number | null, bench: number | null, deadlift: number | null) {
  const best = emptyBestLifts()
  if (squat) best.lifts.squat[1] = lift(squat)
  if (bench) best.lifts.bench[1] = lift(bench)
  if (deadlift) best.lifts.deadlift[1] = lift(deadlift)
  best.hasAny = Boolean(squat || bench || deadlift)
  return best
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getDotsAutofill", () => {
  it("has nothing to fill without a profile", async () => {
    expect(await getDotsAutofill({ ...CLIENT, profile: null })).toBeUndefined()
    expect(mocks.getBestLifts).not.toHaveBeenCalled()
  })

  it("fills body fields from the profile and leaves the total blank for non-clients", async () => {
    const result = await getDotsAutofill({ ...CLIENT, client: false, unlocked: false })
    expect(result).toEqual({
      initialValues: expect.objectContaining({
        weight: "63",
        weightUnit: "kg",
        total: "",
        totalUnit: "kg",
        sex: "female",
      }),
      totalFromPrs: false,
    })
    expect(result?.initialValues.age).toMatch(/^\d+$/)
    expect(mocks.getBestLifts).not.toHaveBeenCalled()
  })

  it("adds the total from a client's best 1RMs in their lift unit", async () => {
    mocks.getBestLifts.mockResolvedValue(bestLifts(150, 90, 180))

    expect(await getDotsAutofill(CLIENT)).toMatchObject({
      initialValues: { total: "420", totalUnit: "kg" },
      totalFromPrs: true,
    })
    expect(mocks.getBestLifts).toHaveBeenCalledWith("user-1")

    // 420 kg → 925.9 lb, rounded to a tenth.
    expect(await getDotsAutofill({ ...CLIENT, liftUnit: "lb" })).toMatchObject({
      initialValues: { total: "925.9", totalUnit: "lb" },
      totalFromPrs: true,
    })
  })

  it("leaves the total blank when a lift is missing", async () => {
    mocks.getBestLifts.mockResolvedValue(bestLifts(150, null, 180))
    expect(await getDotsAutofill(CLIENT)).toMatchObject({
      initialValues: { total: "" },
      totalFromPrs: false,
    })
  })

  it("still fills the profile fields if the PR lookup fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.getBestLifts.mockRejectedValue(new Error("db down"))
    expect(await getDotsAutofill(CLIENT)).toMatchObject({
      initialValues: { weight: "63", total: "" },
      totalFromPrs: false,
    })
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
