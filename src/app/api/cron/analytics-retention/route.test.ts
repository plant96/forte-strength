import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const { purgeExpiredVisits } = vi.hoisted(() => ({ purgeExpiredVisits: vi.fn() }))
vi.mock("@/features/analytics/retention", () => ({ purgeExpiredVisits }))

import { GET } from "./route"

describe("scheduled analytics retention", () => {
  beforeEach(() => {
    purgeExpiredVisits.mockReset().mockResolvedValue({ count: 7 })
    vi.stubEnv("CRON_SECRET", "test-retention-secret")
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.restoreAllMocks()
  })

  function request(token?: string) {
    return new Request("https://fortestrength.org/api/cron/analytics-retention", {
      headers: token ? { authorization: `Bearer ${token}` } : {},
    })
  }

  it.each([undefined, "wrong-secret"])("rejects unauthorized cleanup (%s)", async (token) => {
    expect((await GET(request(token))).status).toBe(401)
    expect(purgeExpiredVisits).not.toHaveBeenCalled()
  })

  it("fails closed when the secret is not configured", async () => {
    vi.stubEnv("CRON_SECRET", "")
    expect((await GET(request("undefined"))).status).toBe(401)
    expect(purgeExpiredVisits).not.toHaveBeenCalled()
  })

  it("returns the cleanup result without caching", async () => {
    const response = await GET(request("test-retention-secret"))
    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ ok: true, deleted: 7 })
    expect(response.headers.get("cache-control")).toBe("no-store")
  })

  it("reports a failed run so the scheduler can detect it", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    purgeExpiredVisits.mockRejectedValue(new Error("database unavailable"))
    expect((await GET(request("test-retention-secret"))).status).toBe(500)
  })
})
