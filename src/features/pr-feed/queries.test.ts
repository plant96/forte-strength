import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ exercises: vi.fn(), entries: vi.fn() }))

vi.mock("@/server/db", () => ({
  db: {
    exercise: { findMany: mocks.exercises },
    prEntry: { findMany: mocks.entries },
  },
}))

import { getTeamPrFeed } from "./queries"

const EXERCISES = [
  { id: "x-squat", name: "Back Squat" },
  { id: "x-front", name: "Front Squat" },
  { id: "x-bench", name: "Bench Press" },
  { id: "x-rdl", name: "Romanian Deadlift" },
  { id: "x-sumo", name: "Sumo Deadlift" },
]

const ENTRY = {
  id: "e-1",
  userId: "u-marcus",
  weightKg: 250,
  achievedOn: new Date("2026-09-24T00:00:00Z"),
  user: { firstName: "Marcus", lastName: "Reyes" },
  series: {
    kind: "ONE_REP_MAX",
    sets: 1,
    reps: 1,
    exerciseId: "x-squat",
    entries: [
      { id: "e-0", weightKg: 240 },
      { id: "e-1", weightKg: 250 },
    ],
  },
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getTeamPrFeed", () => {
  it("reads the team's competition lifts, newest first, twenty at most", async () => {
    mocks.exercises.mockResolvedValue(EXERCISES)
    mocks.entries.mockResolvedValue([ENTRY])

    const feed = await getTeamPrFeed("u-viewer")

    expect(mocks.exercises).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { user: { OR: [{ clientSince: { not: null } }, { role: "ADMIN" }] } },
      }),
    )
    expect(mocks.entries).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { series: { exerciseId: { in: ["x-squat", "x-bench", "x-sumo"] } } },
        orderBy: [{ achievedOn: "desc" }, { createdAt: "desc" }],
        take: 20,
      }),
    )
    // Nothing that could identify a lifter beyond "Marcus R." leaves the server.
    const select = mocks.entries.mock.calls[0]?.[0]?.select as { user: { select: object } }
    expect(select.user.select).toEqual({ firstName: true, lastName: true })

    expect(feed).toEqual([
      {
        id: "e-1",
        name: "Marcus R.",
        mine: false,
        lift: "squat",
        shape: { kind: "one-rep-max", sets: 1, reps: 1 },
        weightKg: 250,
        gainKg: 10,
        achievedOn: "2026-09-24",
      },
    ])
  })

  it("skips the entry query when nobody tracks a competition lift", async () => {
    mocks.exercises.mockResolvedValue([{ id: "x-front", name: "Front Squat" }])

    expect(await getTeamPrFeed("u-viewer")).toEqual([])
    expect(mocks.entries).not.toHaveBeenCalled()
  })

  it("reports the feed as unavailable when the database fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.exercises.mockRejectedValue(new Error("db down"))

    expect(await getTeamPrFeed("u-viewer")).toBeNull()
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
