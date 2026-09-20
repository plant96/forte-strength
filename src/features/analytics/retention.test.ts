import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { deleteMany } = vi.hoisted(() => ({ deleteMany: vi.fn() }))
vi.mock("@/server/db", () => ({ db: { pageView: { deleteMany } } }))

describe("automatic analytics retention", () => {
  beforeEach(() => {
    vi.resetModules()
    deleteMany.mockReset().mockResolvedValue({ count: 3 })
    vi.stubEnv("ANALYTICS_RETENTION_DAYS", "90")
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2026-09-20T12:00:00Z"))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  it("deletes only rows strictly older than the configured cutoff", async () => {
    const { purgeExpiredVisits } = await import("./retention")
    await expect(purgeExpiredVisits()).resolves.toEqual({ count: 3 })
    expect(deleteMany).toHaveBeenCalledWith({
      where: { createdAt: { lt: new Date("2026-06-22T12:00:00Z") } },
    })
  })

  it("coalesces concurrent requests and runs again the next day", async () => {
    const { maybePurgeExpiredVisits } = await import("./retention")
    await Promise.all([maybePurgeExpiredVisits(), maybePurgeExpiredVisits()])
    await maybePurgeExpiredVisits()
    expect(deleteMany).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(24 * 60 * 60 * 1000)
    await maybePurgeExpiredVisits()
    expect(deleteMany).toHaveBeenCalledTimes(2)
  })

  it("keeps collection working on cleanup failure and retries after five minutes", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    deleteMany.mockRejectedValueOnce(new Error("database unavailable"))
    const { maybePurgeExpiredVisits } = await import("./retention")
    await expect(maybePurgeExpiredVisits()).resolves.toBeUndefined()
    await maybePurgeExpiredVisits()
    expect(deleteMany).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(5 * 60 * 1000)
    await maybePurgeExpiredVisits()
    expect(deleteMany).toHaveBeenCalledTimes(2)
  })
})
