import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ getCurrentUser: vi.fn() }))

vi.mock("@/server/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  isClient: (user: { clientSince: Date | null } | null) => user?.clientSince != null,
  canAccessClientArea: (user: { role: string; clientSince: Date | null } | null) =>
    user?.role === "ADMIN" || user?.clientSince != null,
}))

import { getViewer } from "./queries"

const PROFILE = {
  birthDate: new Date("1995-06-15T00:00:00.000Z"),
  sex: "MALE",
  weight: 180.5,
  weightUnit: "LB",
  heightCm: 177.8,
  heightUnit: "FT_IN",
  bodyFatPercent: 15,
  stepsPerDay: 8000,
  sessionsPerWeek: 4,
  intensity: "MODERATE",
}

const USER = {
  id: "user-1",
  role: "USER",
  clientSince: null as Date | null,
  liftUnit: "LB",
  profile: null as typeof PROFILE | null,
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("getViewer", () => {
  it("describes a signed-out visitor", async () => {
    mocks.getCurrentUser.mockResolvedValue(null)
    expect(await getViewer()).toEqual({
      id: null,
      accountState: "signed-out",
      client: false,
      unlocked: false,
      profile: null,
      liftUnit: "lb",
    })
  })

  it("asks a signed-in user without a profile to finish setting up", async () => {
    mocks.getCurrentUser.mockResolvedValue(USER)
    expect(await getViewer()).toMatchObject({
      id: "user-1",
      accountState: "needs-profile",
      client: false,
      unlocked: false,
      profile: null,
      liftUnit: "lb",
    })
  })

  it("marks a coaching client with a profile as complete and unlocked", async () => {
    mocks.getCurrentUser.mockResolvedValue({
      ...USER,
      clientSince: new Date("2026-01-01"),
      liftUnit: "KG",
      profile: PROFILE,
    })
    expect(await getViewer()).toMatchObject({
      accountState: "complete",
      client: true,
      unlocked: true,
      profile: PROFILE,
      liftUnit: "kg",
    })
  })

  it("unlocks admins without calling them clients", async () => {
    mocks.getCurrentUser.mockResolvedValue({ ...USER, role: "ADMIN", profile: PROFILE })
    expect(await getViewer()).toMatchObject({ client: false, unlocked: true })
  })

  it("falls back to a signed-out viewer when the lookup fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.getCurrentUser.mockRejectedValue(new Error("db down"))
    expect(await getViewer()).toMatchObject({ accountState: "signed-out", client: false })
    expect(error).toHaveBeenCalled()
    error.mockRestore()
  })
})
