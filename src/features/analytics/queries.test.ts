import { beforeEach, describe, expect, it, vi } from "vitest"

const { query, requireAdmin } = vi.hoisted(() => ({
  query: vi.fn(),
  requireAdmin: vi.fn(),
}))

vi.mock("@/server/db", () => ({ db: { $queryRaw: query } }))
vi.mock("@/server/auth", () => ({ requireAdmin }))

import { getAnalytics, getVisitorLog, isRangeKey, rangeWindow } from "./queries"

beforeEach(() => {
  vi.resetAllMocks()
  requireAdmin.mockResolvedValue({ role: "ADMIN" })
  query.mockResolvedValue([])
})

describe("analytics ranges", () => {
  it("rejects object prototype names passed in the URL", () => {
    expect(isRangeKey("30d")).toBe(true)
    expect(isRangeKey("constructor")).toBe(false)
    expect(isRangeKey("toString")).toBe(false)
    expect(isRangeKey("__proto__")).toBe(false)
    expect(isRangeKey(undefined)).toBe(false)
  })

  it("uses one snapshot and an adjacent equal-length comparison period", () => {
    const to = new Date("2026-09-19T14:30:00Z")
    const window = rangeWindow("7d", to)
    expect(window.to).toEqual(to)
    expect(window.from.toISOString()).toBe("2026-09-12T14:30:00.000Z")
    expect(window.previousFrom.toISOString()).toBe("2026-09-05T14:30:00.000Z")
  })
})

describe("analytics access", () => {
  it("checks admin access before querying sensitive visit data", async () => {
    requireAdmin.mockRejectedValue(new Error("Forbidden"))
    await expect(getAnalytics("30d")).rejects.toThrow("Forbidden")
    await expect(getVisitorLog("30d", { page: 1, perPage: 25, includeBots: false })).rejects.toThrow("Forbidden")
    expect(query).not.toHaveBeenCalled()
  })
})

describe("visitor log", () => {
  it("clamps an out-of-range page and returns the last real page", async () => {
    const rows = [{ id: "last-view" }]
    query.mockResolvedValueOnce([{ total: 26 }]).mockResolvedValueOnce(rows)
    const result = await getVisitorLog("30d", { page: 999, perPage: 25, includeBots: false })
    expect(result).toEqual({ rows, total: 26, page: 2, pageCount: 2 })
    const sql = query.mock.calls[1][0]
    expect(sql.values.slice(-2)).toEqual([25, 25])
    expect(sql.sql).toContain('ORDER BY "createdAt" DESC, "id" DESC')
  })

  it("bounds invalid pagination before sending numbers to SQL", async () => {
    query.mockResolvedValueOnce([{ total: 1 }]).mockResolvedValueOnce([])
    const result = await getVisitorLog("30d", { page: Infinity, perPage: NaN, includeBots: false })
    expect(result.page).toBe(1)
    expect(query.mock.calls[1][0].values.slice(-2)).toEqual([25, 0])
  })

  it("searches percent, underscore, and backslash literally with parameterized filters", async () => {
    await getVisitorLog("30d", {
      page: 1,
      perPage: 25,
      includeBots: false,
      country: "US",
      device: "MOBILE",
      search: "100%_\\",
    })
    const sql = query.mock.calls[0][0]
    expect(sql.values).toContain("%100\\%\\_\\\\%")
    expect(sql.values).toContain("US")
    expect(sql.values).toContain("MOBILE")
    expect(sql.sql).toContain('"isBot" = false')
    expect(sql.sql).not.toContain("100%")
  })
})
