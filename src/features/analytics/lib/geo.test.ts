import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("./config", () => ({ GEOIP_ENDPOINT: "https://geo.test/{ip}" }))

import { clientIpFrom, geoFromHeaders, isPrivateIp, resolveLocation } from "./geo"

const fetchMock = vi.fn()

beforeEach(() => {
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe("analytics IP and location", () => {
  it("prefers platform IP headers and validates forwarded addresses", () => {
    expect(
      clientIpFrom(
        new Headers({
          "x-vercel-forwarded-for": "8.8.8.8",
          "x-forwarded-for": "1.1.1.1, 10.0.0.1",
        }),
      ),
    ).toBe("8.8.8.8")
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "1.1.1.1, 10.0.0.1" }))).toBe("1.1.1.1")
    expect(
      clientIpFrom(new Headers({ "x-forwarded-for": "garbage", "x-real-ip": "8.8.4.4" })),
    ).toBe("8.8.4.4")
    expect(clientIpFrom(new Headers({ "x-forwarded-for": "not-an-ip" }))).toBeNull()
    expect(clientIpFrom(new Headers({ "x-real-ip": "fe80::1%eth0" }))).toBeNull()
  })

  it.each([
    "127.5.6.7",
    "10.1.2.3",
    "172.31.255.255",
    "192.168.1.2",
    "169.254.1.1",
    "100.64.0.1",
    "::",
    "::1",
    "FE80::1",
    "fd12::1",
    "ff02::1",
    "::ffff:127.0.0.1",
    "0:0:0:0:0:ffff:c0a8:101",
    "bad-value",
  ])("does not send a private or invalid address to geo lookup: %s", async (ip) => {
    expect(isPrivateIp(ip)).toBe(true)
    await resolveLocation(new Headers(), ip)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("decodes platform locations and rejects invalid coordinate/country values", () => {
    expect(
      geoFromHeaders(
        new Headers({
          "x-vercel-ip-country": "us",
          "x-vercel-ip-city": "New%20York",
          "x-vercel-ip-latitude": "40.71",
          "x-vercel-ip-longitude": "-74.01",
        }),
      ),
    ).toMatchObject({ country: "US", city: "New York", latitude: 40.71, longitude: -74.01 })
    expect(
      geoFromHeaders(
        new Headers({
          "cf-ipcountry": "XX",
          "x-vercel-ip-latitude": "91",
          "x-vercel-ip-longitude": "Infinity",
        }),
      ),
    ).toMatchObject({ country: null, latitude: null, longitude: null })
  })

  it("uses platform location without contacting the optional provider", async () => {
    expect(
      await resolveLocation(new Headers({ "x-vercel-ip-country": "US" }), "8.8.8.8"),
    ).toMatchObject({ country: "US" })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("caches provider results for an hour and preserves partial platform values", async () => {
    let now = 1000
    vi.spyOn(Date, "now").mockImplementation(() => now)
    fetchMock.mockImplementation(async () =>
      Response.json({
        country_code: "GB",
        region: "England",
        city: "London",
        latitude: 51.5,
        longitude: -0.1,
      }),
    )
    const headers = new Headers({ "x-vercel-ip-city": "Local%20City" })
    const location = await resolveLocation(headers, "1.0.0.1")
    expect(location).toMatchObject({ country: "GB", city: "Local City", latitude: 51.5 })
    await resolveLocation(headers, "1.0.0.1")
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      "https://geo.test/1.0.0.1",
      expect.objectContaining({ cache: "no-store" }),
    )
    now += 60 * 60 * 1000 + 1
    await resolveLocation(headers, "1.0.0.1")
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it("keeps collection working when the provider fails", async () => {
    fetchMock.mockRejectedValueOnce(new Error("timeout"))
    expect(await resolveLocation(new Headers(), "9.9.9.9")).toMatchObject({
      country: null,
      city: null,
    })
  })
})
