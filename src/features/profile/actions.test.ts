import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  update: vi.fn(),
  clerkUpdate: vi.fn(),
  after: vi.fn(),
  revalidatePath: vi.fn(),
  redirect: vi.fn(),
  notifyProfileCompleted: vi.fn(),
}))

vi.mock("@/server/auth", () => ({
  requireUser: mocks.requireUser,
  isLockedToOnboarding: (user: { onboardingRequired: boolean; onboardedAt: Date | null }) =>
    user.onboardingRequired && !user.onboardedAt,
}))
vi.mock("@/server/db", () => ({
  db: { user: { update: mocks.update }, profile: {}, $transaction: vi.fn() },
}))
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { updateUser: mocks.clerkUpdate } }),
}))
vi.mock("next/server", () => ({ after: mocks.after }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("@/features/notifications/notify", () => ({
  notifyProfileCompleted: mocks.notifyProfileCompleted,
}))

import { saveName, skipOnboarding } from "./actions"

const USER = {
  id: "user-1",
  clerkId: "clerk-1",
  onboardingRequired: false,
  onboardedAt: null as Date | null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireUser.mockResolvedValue(USER)
  mocks.update.mockResolvedValue({})
  mocks.clerkUpdate.mockResolvedValue({})
  // Run deferred work immediately so its effects can be asserted.
  mocks.after.mockImplementation((work: () => unknown) => work())
  mocks.redirect.mockImplementation((url: string) => {
    throw new Error(`REDIRECT:${url}`)
  })
})

describe("saveName", () => {
  it("rejects blank names with a message per field and saves nothing", async () => {
    const result = await saveName({ firstName: "  ", lastName: "" })
    expect(result).toEqual({
      ok: false,
      message: expect.any(String),
      fieldErrors: { firstName: "Enter your first name", lastName: "Enter your last name" },
    })
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("trims, saves to the database, mirrors to Clerk and refreshes the layout", async () => {
    const result = await saveName({ firstName: " Jordan ", lastName: "Lee " })
    expect(result).toEqual({ ok: true })
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { firstName: "Jordan", lastName: "Lee" },
    })
    expect(mocks.after).toHaveBeenCalledTimes(1)
    expect(mocks.clerkUpdate).toHaveBeenCalledWith("clerk-1", {
      firstName: "Jordan",
      lastName: "Lee",
    })
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout")
  })

  it("still succeeds when Clerk refuses the mirror", async () => {
    mocks.clerkUpdate.mockRejectedValue(new Error("Clerk down"))
    const result = await saveName({ firstName: "Jordan", lastName: "Lee" })
    expect(result).toEqual({ ok: true })
  })
})

describe("skipOnboarding", () => {
  it("sends a locked account straight back to the wizard without skipping", async () => {
    mocks.requireUser.mockResolvedValue({ ...USER, onboardingRequired: true })
    await expect(skipOnboarding()).rejects.toThrow("REDIRECT:/onboarding")
    expect(mocks.update).not.toHaveBeenCalled()
  })

  it("records the skip for everyone else and goes home", async () => {
    await expect(skipOnboarding()).rejects.toThrow("REDIRECT:/")
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { onboardingSkippedAt: expect.any(Date) },
    })
  })
})
