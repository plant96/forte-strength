import { act, cleanup, render } from "@testing-library/react"
import { StrictMode } from "react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const navigation = vi.hoisted(() => ({ pathname: "/" }))
vi.mock("next/navigation", () => ({ usePathname: () => navigation.pathname }))

import { AnalyticsBeacon } from "./analytics-beacon"

const fetchMock = vi.fn()
const sendBeacon = vi.fn()
let now = 0
let visibility: DocumentVisibilityState = "visible"

async function beaconPayload(index: number) {
  const blob: Blob = sendBeacon.mock.calls[index][1]
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsText(blob)
  })
  return JSON.parse(text)
}

function hide() {
  visibility = "hidden"
  document.dispatchEvent(new Event("visibilitychange"))
}

function show() {
  visibility = "visible"
  document.dispatchEvent(new Event("visibilitychange"))
}

beforeEach(() => {
  now = 0
  visibility = "visible"
  navigation.pathname = "/"
  window.history.replaceState(null, "", "/")
  vi.spyOn(performance, "now").mockImplementation(() => now)
  vi.spyOn(document, "visibilityState", "get").mockImplementation(() => visibility)
  vi.spyOn(document, "referrer", "get").mockReturnValue("https://google.com/search")
  fetchMock.mockReset().mockImplementation(async () => Response.json({ id: "view-1" }))
  sendBeacon.mockReset().mockReturnValue(true)
  Object.defineProperty(navigator, "sendBeacon", { configurable: true, value: sendBeacon })
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("AnalyticsBeacon", () => {
  it("counts visible time across repeated hides without counting background time", async () => {
    await act(async () => {
      render(<AnalyticsBeacon />)
    })
    now = 1000
    hide()
    now = 10_000
    show()
    now = 12_000
    hide()
    expect(await beaconPayload(0)).toEqual({ type: "duration", id: "view-1", durationMs: 1000 })
    expect(await beaconPayload(1)).toEqual({ type: "duration", id: "view-1", durationMs: 3000 })
    window.dispatchEvent(new Event("pagehide"))
    expect(sendBeacon).toHaveBeenCalledTimes(2)
  })

  it("saves duration when navigation happens before the view acknowledgement", async () => {
    let acknowledge!: (response: Response) => void
    fetchMock.mockImplementationOnce(
      () =>
        new Promise<Response>((resolve) => {
          acknowledge = resolve
        }),
    )
    fetchMock.mockImplementationOnce(async () => Response.json({ id: "view-2" }))
    const rendered = render(<AnalyticsBeacon />)
    await act(async () => {})
    now = 1000
    navigation.pathname = "/gallery"
    window.history.pushState(null, "", "/gallery")
    await act(async () => {
      rendered.rerender(<AnalyticsBeacon />)
    })
    // The next view waits for the response that establishes session cookies.
    expect(fetchMock).toHaveBeenCalledTimes(1)
    await act(async () => {
      acknowledge(Response.json({ id: "view-1" }))
    })
    expect(await beaconPayload(0)).toMatchObject({ id: "view-1", durationMs: 1000 })
    expect(fetchMock).toHaveBeenCalledTimes(2)
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).referrer).toBe("https://google.com/search")
    expect(JSON.parse(fetchMock.mock.calls[1][1].body)).toMatchObject({
      path: "/gallery",
      referrer: `${window.location.origin}/`,
    })
    now = 2500
    hide()
    expect(await beaconPayload(1)).toMatchObject({ id: "view-2", durationMs: 1500 })
  })

  it("records one view during Strict Mode's effect replay", async () => {
    await act(async () => {
      render(
        <StrictMode>
          <AnalyticsBeacon />
        </StrictMode>,
      )
    })
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it("excludes admin pages", async () => {
    navigation.pathname = "/admin/analytics"
    await act(async () => {
      render(<AnalyticsBeacon />)
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("caps duration and falls back to fetch if sendBeacon refuses the payload", async () => {
    sendBeacon.mockReturnValue(false)
    await act(async () => {
      render(<AnalyticsBeacon />)
    })
    now = 7 * 60 * 60 * 1000
    hide()
    expect(await beaconPayload(0)).toMatchObject({ durationMs: 6 * 60 * 60 * 1000 })
    expect(JSON.parse(fetchMock.mock.calls[1][1].body).type).toBe("duration")
    expect(fetchMock.mock.calls[1][1].keepalive).toBe(true)
  })

  it("resumes visible timing after restoration from the back-forward cache", async () => {
    await act(async () => {
      render(<AnalyticsBeacon />)
    })
    now = 1000
    window.dispatchEvent(new Event("pagehide"))
    now = 10_000
    window.dispatchEvent(new Event("pageshow"))
    now = 12_000
    hide()
    expect(await beaconPayload(1)).toMatchObject({ durationMs: 3000 })
  })
})
