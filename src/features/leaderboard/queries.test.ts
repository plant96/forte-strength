import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ findMany: vi.fn() }))

vi.mock("@/server/db", () => ({ db: { user: { findMany: mocks.findMany } } }))

import { getLeaderboard } from "./queries"

const TODAY = new Date(2026, 8, 25)

const CLIENT = {
  id: "u-1",
  firstName: "Marcus",
  lastName: "Reyes",
  profile: {
    birthDate: new Date("1998-03-10T00:00:00Z"),
    sex: "MALE",
    weight: 93,
    weightUnit: "KG",
  },
  prSeries: [
    {
      exercise: { name: "Squat" },
      entries: [{ weightKg: 250, achievedOn: new Date("2026-08-12T00:00:00Z") }],
    },
    {
      exercise: { name: "Bench Press" },
      entries: [{ weightKg: 150, achievedOn: new Date("2026-08-12T00:00:00Z") }],
    },
    {
      exercise: { name: "Deadlift" },
      entries: [{ weightKg: 300, achievedOn: new Date("2026-08-12T00:00:00Z") }],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getLeaderboard", () => {
  it("reads clients with a profile and their best 1RM per series", async () => {
    mocks.findMany.mockResolvedValue([CLIENT])
    const snapshot = await getLeaderboard(TODAY)

    expect(mocks.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { clientSince: { not: null }, profile: { isNot: null } },
        select: expect.objectContaining({
          firstName: true,
          lastName: true,
          prSeries: expect.objectContaining({
            where: { kind: "ONE_REP_MAX" },
            select: expect.objectContaining({
              entries: expect.objectContaining({ orderBy: { weightKg: "desc" }, take: 1 }),
            }),
          }),
        }),
      }),
    )
    // Nothing that could identify a lifter beyond "Marcus R." leaves the server.
    const select = mocks.findMany.mock.calls[0]?.[0]?.select as Record<string, unknown>
    expect(select).not.toHaveProperty("email")
    expect(select).not.toHaveProperty("imageUrl")

    expect(snapshot.unavailable).toBe(false)
    expect(snapshot.athletes).toHaveLength(1)
    expect(snapshot.athletes[0]).toMatchObject({ name: "Marcus R.", totalKg: 700, ageYears: 28 })
  })

  it("reports the board as unavailable when the database fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.findMany.mockRejectedValue(new Error("db down"))

    expect(await getLeaderboard(TODAY)).toEqual({ athletes: [], unavailable: true })
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
