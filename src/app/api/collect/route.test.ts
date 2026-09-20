import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  execute: vi.fn(),
  after: vi.fn(),
  purge: vi.fn(),
  geo: vi.fn(),
}))

vi.mock("next/server", async (original) => ({
  ...(await original<typeof import("next/server")>()),
  after: mocks.after,
}))
vi.mock("@/server/db", () => ({
  db: { pageView: { create: mocks.create }, $executeRaw: mocks.execute },
}))
vi.mock("@/features/analytics/retention", () => ({ maybePurgeExpiredVisits: mocks.purge }))
vi.mock("@/features/analytics/lib/geo", () => ({
  clientIpFrom: () => "8.8.8.8",
  resolveLocation: mocks.geo,
}))

import { POST } from "./route"

const visitorId = "a".repeat(32)
const sessionId = "b".repeat(32)
const viewId = "c".repeat(32)

function request(body: unknown, extraHeaders: Record<string, string> = {}) {
  return new Request("https://forte.test/api/collect", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://forte.test", ...extraHeaders },
    body: JSON.stringify(body),
  })
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.create.mockResolvedValue({})
  mocks.execute.mockResolvedValue(1)
  mocks.geo.mockResolvedValue({
    country: "US",
    region: "FL",
    city: "Tampa",
    latitude: 28,
    longitude: -82,
  })
})

describe("analytics collector", () => {
  it("records a view with campaign tags and renews the current visitor/session", async () => {
    const response = await POST(
      request(
        {
          type: "view",
          path: "/gallery?utm_source=instagram&utm_medium=social&utm_campaign=fall#photo",
          referrer: "https://www.google.com/search?q=fitness",
        },
        { cookie: `fs_vid=${visitorId}; fs_sid=${sessionId}` },
      ),
    )

    expect(response.status).toBe(200)
    expect((await response.json()).id).toMatch(/^[a-f0-9]{32}$/)
    expect(mocks.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        visitorId,
        sessionId,
        isEntry: false,
        path: "/gallery",
        utmSource: "instagram",
        utmMedium: "social",
        utmCampaign: "fall",
        referrerHost: "google.com",
        ipAddress: "8.8.8.8",
      }),
    })
    expect(response.cookies.get("fs_vid")?.value).toBe(visitorId)
    expect(response.cookies.get("fs_sid")?.value).toBe(sessionId)
    expect(response.headers.get("set-cookie")).toContain("HttpOnly")
    expect(response.headers.get("set-cookie")).toContain("Secure")
    expect(mocks.after).toHaveBeenCalledWith(mocks.purge)
  })

  it("issues fresh identifiers for malformed cookies and ignores orphaned sessions", async () => {
    const response = await POST(
      request(
        { type: "view", path: "/" },
        {
          cookie: `fs_vid=arbitrary; fs_sid=${sessionId}`,
        },
      ),
    )
    const row = mocks.create.mock.calls[0][0].data
    expect(row.visitorId).toMatch(/^[a-f0-9]{32}$/)
    expect(row.sessionId).not.toBe(sessionId)
    expect(row.isEntry).toBe(true)
    expect(response.status).toBe(200)
  })

  it.each(["https://other.test/", "//other.test/", "/\\other.test/", "no-leading-slash"])(
    "rejects nonlocal paths: %s",
    async (path) => {
      expect((await POST(request({ type: "view", path }))).status).toBe(400)
      expect(mocks.create).not.toHaveBeenCalled()
    },
  )

  it("normalizes traversal before excluding private pages", async () => {
    expect(
      (await POST(request({ type: "view", path: "/public/../admin?tab=analytics" }))).status,
    ).toBe(204)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it("rejects cross-origin and non-JSON writes", async () => {
    expect(
      (await POST(request({ type: "view", path: "/" }, { origin: "https://other.test" }))).status,
    ).toBe(403)
    expect(
      (await POST(request({ type: "view", path: "/" }, { "content-type": "text/plain" }))).status,
    ).toBe(415)
    expect(mocks.create).not.toHaveBeenCalled()
  })

  it("acknowledges views only after a successful database write", async () => {
    const logger = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.create.mockRejectedValueOnce(new Error("unavailable"))
    const response = await POST(request({ type: "view", path: "/" }))
    expect(response.status).toBe(503)
    expect(await response.json()).not.toHaveProperty("id")
    expect(mocks.after).not.toHaveBeenCalled()
    logger.mockRestore()
  })

  it("limits duration updates to the visitor and keeps the longest cumulative value", async () => {
    const response = await POST(
      request(
        { type: "duration", id: viewId, durationMs: 5000 },
        {
          cookie: `fs_vid=${visitorId}`,
        },
      ),
    )
    expect(response.status).toBe(204)
    await mocks.after.mock.calls[0][0]()
    const [strings, ...values] = mocks.execute.mock.calls[0]
    expect(strings.join("?")).toContain('AND "visitorId" = ?')
    expect(strings.join("?")).toContain('"durationMs" < ?')
    expect(values).toEqual([5000, viewId, visitorId, 5000])
  })

  it("discards duration pings without a valid visitor cookie", async () => {
    expect((await POST(request({ type: "duration", id: viewId, durationMs: 5000 }))).status).toBe(
      204,
    )
    expect(mocks.after).not.toHaveBeenCalled()
  })
})
