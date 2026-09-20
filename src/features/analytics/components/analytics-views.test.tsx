import { render, screen, within } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { ActivityHeatmap } from "./activity-heatmap"
import { MetricTile } from "./analytics-ui"
import { DeviceDonut } from "./device-donut"
import { StatBars } from "./stat-bars"
import { VisitorLog } from "./visitor-log"
import { VisitorMap } from "./visitor-map"
import type { VisitorLogRow } from "../queries"

describe("StatBars", () => {
  const rows = [
    { label: "/", views: 200, visitors: 120 },
    { label: "/gallery", views: 50, visitors: 40 },
  ]

  it("shows each row's share of the total", () => {
    render(<StatBars rows={rows} total={400} />)

    expect(screen.getByText("/")).toBeInTheDocument()
    // 200 of 400, not 200 of the 250 on screen — the denominator is explicit.
    expect(screen.getByText("50%")).toBeInTheDocument()
    expect(screen.getByText("13%")).toBeInTheDocument()
  })

  it("falls back to the rows themselves when no total is given", () => {
    render(<StatBars rows={rows} />)
    expect(screen.getByText("80%")).toBeInTheDocument()
  })

  it("says so when there's nothing to show", () => {
    render(<StatBars rows={[]} emptyLabel="No campaigns yet" />)
    expect(screen.getByText("No campaigns yet")).toBeInTheDocument()
  })
})

describe("MetricTile", () => {
  it("reads a rise as an improvement by default", () => {
    render(<MetricTile label="Page views" value="675" change={0.2} />)
    expect(screen.getByText("675")).toBeInTheDocument()
    expect(screen.getByText("20%")).toBeInTheDocument()
    expect(screen.getByText("vs previous period")).toBeInTheDocument()
  })

  // Bounce rate is the one metric where down is good; the colour must agree.
  it("inverts the judgement when lower is better", () => {
    const { container: worse } = render(
      <MetricTile label="Bounce rate" value="58%" change={0.2} lowerIsBetter />,
    )
    expect(worse.querySelector(".text-destructive")).not.toBeNull()

    const { container: better } = render(
      <MetricTile label="Bounce rate" value="41%" change={-0.2} lowerIsBetter />,
    )
    expect(better.querySelector(".text-destructive")).toBeNull()
  })

  it("says there's no baseline rather than inventing one", () => {
    render(<MetricTile label="Sessions" value="0" change={null} />)
    expect(screen.getByText("No prior period")).toBeInTheDocument()
  })
})

describe("ActivityHeatmap", () => {
  it("draws a cell for every hour of every weekday, plus a scale", () => {
    const { container } = render(
      <ActivityHeatmap
        data={[
          { weekday: 1, hour: 9, views: 12 },
          { weekday: 5, hour: 16, views: 19 },
        ]}
        timezone="America/New_York"
      />,
    )

    expect(container.querySelectorAll("[title]")).toHaveLength(7 * 24)
    expect(screen.getByTitle("Mon 9:00 — 12 views")).toBeInTheDocument()
    expect(screen.getByTitle("Sun 0:00 — 0 views")).toBeInTheDocument()
    expect(screen.getByText(/America\/New_York/)).toBeInTheDocument()
    // The legend interleaves swatches between the words, so match loosely.
    expect(screen.getByText(/Less/)).toBeInTheDocument()
    expect(screen.getByText(/More/)).toBeInTheDocument()
  })

  it("is empty-stated rather than drawn blank", () => {
    render(<ActivityHeatmap data={[]} timezone="UTC" />)
    expect(screen.getByText("No data yet")).toBeInTheDocument()
  })
})

describe("VisitorMap", () => {
  const points = [
    { latitude: 27.95, longitude: -82.46, city: "Tampa", country: "US", views: 76 },
    { latitude: 51.51, longitude: -0.13, city: "London", country: "GB", views: 12 },
  ]

  it("plots a dot per location, labelled with its place and count", () => {
    const { container } = render(<VisitorMap points={points} />)

    expect(container.querySelectorAll("circle")).toHaveLength(2)
    // Queried directly: `getByTitle` only sees a <title> that is a direct child
    // of <svg>, while labelling a shape means nesting it inside that shape.
    const titles = [...container.querySelectorAll("title")].map((node) => node.textContent)
    expect(titles).toContain("Tampa, United States — 76 views")
    expect(titles).toContain("London, United Kingdom — 12 views")
  })

  it("sizes dots by area, so a 6x count is not a 6x radius", () => {
    const { container } = render(<VisitorMap points={points} />)
    const [big, small] = [...container.querySelectorAll("circle")].map((c) =>
      Number(c.getAttribute("r")),
    )
    expect(big).toBeGreaterThan(small)
    expect(big / small).toBeLessThan(points[0].views / points[1].views)
  })

  it("explains how to switch location on when there's none", () => {
    render(<VisitorMap points={[]} />)
    expect(screen.getByText("No located visits yet")).toBeInTheDocument()
    expect(screen.getByText("ANALYTICS_GEOIP_ENDPOINT")).toBeInTheDocument()
  })
})

describe("VisitorLog", () => {
  const row: VisitorLogRow = {
    id: "v1",
    createdAt: new Date("2026-09-19T14:30:00Z"),
    visitorId: "abcdef1234567890",
    sessionId: "session123",
    ipAddress: "203.0.113.42",
    country: "US",
    region: "FL",
    city: "Tampa",
    timezone: "America/New_York",
    path: "/tdee-calculator",
    referrerHost: "instagram.com",
    browser: "Safari",
    os: "iOS",
    device: "MOBILE",
    screenW: 390,
    screenH: 844,
    language: "en-US",
    durationMs: 95000,
    isBot: false,
    userId: null,
  }

  it("shows the raw IP, location, page and time on page", () => {
    render(<VisitorLog rows={[row]} />)
    const table = screen.getByRole("table")

    expect(within(table).getByText("203.0.113.42")).toBeInTheDocument()
    expect(within(table).getByText(/Tampa/)).toBeInTheDocument()
    expect(within(table).getByText("/tdee-calculator")).toBeInTheDocument()
    expect(within(table).getByText("instagram.com")).toBeInTheDocument()
    expect(within(table).getByText("1m 35s")).toBeInTheDocument()
    // Truncated for scanning, full value still available.
    expect(within(table).getByTitle("abcdef1234567890")).toHaveTextContent("abcdef12")
  })

  it("marks bots and copes with everything unknown", () => {
    render(
      <VisitorLog
        rows={[
          {
            ...row,
            id: "v2",
            isBot: true,
            ipAddress: null,
            country: null,
            city: null,
            durationMs: null,
            browser: null,
          },
        ]}
      />,
    )
    const table = screen.getByRole("table")
    expect(within(table).getByText("bot")).toBeInTheDocument()
    // Both the location and the browser fall back, so there are two of these.
    expect(within(table).getAllByText("Unknown")).toHaveLength(2)
    // A missing IP and a missing duration both render as a dash, never "null".
    expect(within(table).getAllByText("—")).toHaveLength(2)
  })

  it("shows zero recorded duration and formats dates in the configured zone", () => {
    render(<VisitorLog rows={[{ ...row, durationMs: 0 }]} timezone="America/New_York" />)
    const table = screen.getByRole("table")
    expect(within(table).getByText("0s")).toBeInTheDocument()
    expect(within(table).getByText(/Sep 19, 10:30 AM/)).toBeInTheDocument()
  })
})

describe("DeviceDonut", () => {
  it("names every slice in a legend, so identity isn't colour alone", () => {
    render(
      <DeviceDonut
        rows={[
          { label: "DESKTOP", views: 403, visitors: 200 },
          { label: "MOBILE", views: 195, visitors: 100 },
          { label: "TABLET", views: 77, visitors: 40 },
        ]}
      />,
    )

    expect(screen.getByText("Desktop")).toBeInTheDocument()
    expect(screen.getByText("Mobile")).toBeInTheDocument()
    expect(screen.getByText("Tablet")).toBeInTheDocument()
    expect(screen.getByText("403")).toBeInTheDocument()
  })

  // A one-slice donut is a number drawn slowly.
  it("degrades to a figure when there's only one class", () => {
    render(<DeviceDonut rows={[{ label: "DESKTOP", views: 12, visitors: 5 }]} />)
    expect(screen.getByText("Desktop")).toBeInTheDocument()
    expect(screen.getByText(/every visit so far/)).toBeInTheDocument()
  })
})
