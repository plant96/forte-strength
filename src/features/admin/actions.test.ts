import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  findUnique: vi.fn(),
  deleteRow: vi.fn(),
  clerkDelete: vi.fn(),
  isClerkError: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/server/auth", () => ({ requireAdmin: mocks.requireAdmin }))
vi.mock("@/server/db", () => ({
  db: { user: { findUnique: mocks.findUnique, delete: mocks.deleteRow } },
}))
vi.mock("@clerk/nextjs/server", () => ({
  clerkClient: async () => ({ users: { deleteUser: mocks.clerkDelete } }),
}))
vi.mock("@clerk/nextjs/errors", () => ({ isClerkAPIResponseError: mocks.isClerkError }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

import { deleteUser } from "./actions"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.requireAdmin.mockResolvedValue({ id: "admin-1" })
  mocks.findUnique.mockResolvedValue({ clerkId: "clerk-2", role: "USER" })
  mocks.clerkDelete.mockResolvedValue({})
  mocks.deleteRow.mockResolvedValue({})
  mocks.isClerkError.mockReturnValue(false)
})

describe("deleteUser", () => {
  it("refuses to delete the signed-in admin", async () => {
    const result = await deleteUser("admin-1")
    expect(result).toEqual({ ok: false, message: expect.stringMatching(/own account/) })
    expect(mocks.findUnique).not.toHaveBeenCalled()
    expect(mocks.clerkDelete).not.toHaveBeenCalled()
  })

  it("refuses to delete another admin", async () => {
    mocks.findUnique.mockResolvedValue({ clerkId: "clerk-9", role: "ADMIN" })
    const result = await deleteUser("user-9")
    expect(result.ok).toBe(false)
    expect(mocks.clerkDelete).not.toHaveBeenCalled()
    expect(mocks.deleteRow).not.toHaveBeenCalled()
  })

  it("reports a user that is already gone", async () => {
    mocks.findUnique.mockResolvedValue(null)
    const result = await deleteUser("user-2")
    expect(result).toEqual({ ok: false, message: expect.stringMatching(/already gone/) })
  })

  it("deletes from Clerk first, then the database, then revalidates", async () => {
    const result = await deleteUser("user-2")
    expect(result).toEqual({ ok: true })
    expect(mocks.clerkDelete).toHaveBeenCalledWith("clerk-2")
    expect(mocks.deleteRow).toHaveBeenCalledWith({ where: { id: "user-2" } })
    expect(mocks.clerkDelete.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.deleteRow.mock.invocationCallOrder[0],
    )
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin", "layout")
  })

  it("carries on when Clerk has already forgotten the account", async () => {
    const gone = Object.assign(new Error("Not found"), { status: 404 })
    mocks.clerkDelete.mockRejectedValue(gone)
    mocks.isClerkError.mockReturnValue(true)

    const result = await deleteUser("user-2")
    expect(result).toEqual({ ok: true })
    expect(mocks.deleteRow).toHaveBeenCalled()
  })

  it("stops before touching the database when Clerk fails for another reason", async () => {
    const boom = Object.assign(new Error("Rate limited"), { status: 429 })
    mocks.clerkDelete.mockRejectedValue(boom)
    mocks.isClerkError.mockReturnValue(true)

    const result = await deleteUser("user-2")
    expect(result.ok).toBe(false)
    expect(mocks.deleteRow).not.toHaveBeenCalled()
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
  })
})
