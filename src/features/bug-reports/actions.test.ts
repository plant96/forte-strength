import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getCurrentUser: vi.fn(),
  requireAdmin: vi.fn(),
  findFirst: vi.fn(),
  create: vi.fn(),
  deleteRow: vi.fn(),
  after: vi.fn(),
  revalidatePath: vi.fn(),
  notifyBugReport: vi.fn(),
}))

vi.mock("@/server/auth", () => ({
  getCurrentUser: mocks.getCurrentUser,
  requireAdmin: mocks.requireAdmin,
}))
vi.mock("@/server/db", () => ({
  db: {
    bugReport: {
      findFirst: mocks.findFirst,
      create: mocks.create,
      update: vi.fn(),
      delete: mocks.deleteRow,
    },
  },
}))
vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "TestBrowser/1.0" }),
}))
vi.mock("next/server", () => ({ after: mocks.after }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("@/features/notifications/notify", () => ({ notifyBugReport: mocks.notifyBugReport }))

import { deleteBugReport, submitBugReport } from "./actions"
import { BUG_REPORT_DEFAULTS } from "./schema"

const INPUT = {
  ...BUG_REPORT_DEFAULTS,
  description: "The PR chart is blank on my phone.",
  path: "/tools/pr-tracker",
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getCurrentUser.mockResolvedValue(null)
  mocks.requireAdmin.mockResolvedValue({ id: "admin-1" })
  mocks.findFirst.mockResolvedValue(null)
  mocks.create.mockImplementation(async ({ data }: { data: object }) => ({
    id: "bug-1",
    createdAt: new Date(),
    ...data,
  }))
  mocks.deleteRow.mockResolvedValue({})
  mocks.after.mockImplementation((work: () => unknown) => work())
})

describe("submitBugReport", () => {
  it("swallows honeypot submissions without saving", async () => {
    const result = await submitBugReport({ ...INPUT, website: "http://spam" })
    expect(result).toEqual({ ok: true })
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it("returns field errors for a too-short description", async () => {
    const result = await submitBugReport({ ...INPUT, description: "broken" })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.fieldErrors?.description).toMatch(/at least 10/)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it("files an anonymous report with the server-read user agent and notifies the coach", async () => {
    const result = await submitBugReport({ ...INPUT, email: "sam@example.com" })
    expect(result).toEqual({ ok: true })
    expect(mocks.create).toHaveBeenCalledWith({
      data: {
        description: "The PR chart is blank on my phone.",
        path: "/tools/pr-tracker",
        userAgent: "TestBrowser/1.0",
        userId: null,
        email: "sam@example.com",
      },
    })
    expect(mocks.notifyBugReport).toHaveBeenCalledWith(expect.objectContaining({ id: "bug-1" }))
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/admin", "layout")
  })

  it("identifies a signed-in reporter by their account, not the form", async () => {
    mocks.getCurrentUser.mockResolvedValue({ id: "user-1", email: "me@example.com" })
    await submitBugReport({ ...INPUT, email: "someone@else.com" })
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ userId: "user-1", email: "me@example.com" }),
    })
  })

  it("ignores a double-submit from the same person", async () => {
    mocks.findFirst.mockResolvedValue({ id: "bug-0" })
    const result = await submitBugReport(INPUT)
    expect(result).toEqual({ ok: true })
    expect(mocks.create).not.toHaveBeenCalled()
  })
})

describe("deleteBugReport", () => {
  it("only deletes archived reports", async () => {
    await deleteBugReport("bug-1")
    expect(mocks.deleteRow).toHaveBeenCalledWith({ where: { id: "bug-1", status: "ARCHIVED" } })
  })

  it("explains when the delete is refused", async () => {
    mocks.deleteRow.mockRejectedValue(new Error("Record not found"))
    const result = await deleteBugReport("bug-1")
    expect(result.ok).toBe(false)
  })
})
