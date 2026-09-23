import { describe, expect, it } from "vitest"

import { publicNavHrefs, siteConfig } from "@/config/site"

import { buildNavEntries, isNavMenuView } from "./nav-entries"

const comingSoon = {
  tools: [{ id: "t1", title: "Meet Planner" }],
  resources: [{ id: "r1", title: "Warm-up Library" }],
}

const titles = (entries: ReturnType<typeof buildNavEntries>) => entries.map((e) => e.title)

describe("buildNavEntries", () => {
  it("leaves the public nav untouched for a visitor", () => {
    const entries = buildNavEntries({ client: false, unlocked: false, comingSoon })
    expect(titles(entries)).toEqual(siteConfig.mainNav.map((e) => e.title))
    for (const entry of entries) {
      if (isNavMenuView(entry)) expect(entry.comingSoon).toEqual([])
    }
  })

  it("swaps Coaching for Dashboard and appends teasers for a client", () => {
    const entries = buildNavEntries({ client: true, unlocked: true, comingSoon })
    expect(titles(entries)).toEqual(["Dashboard", "Gallery", "Tools", "Resources"])
    const tools = entries.find((e) => e.title === "Tools")
    const resources = entries.find((e) => e.title === "Resources")
    expect(tools && isNavMenuView(tools) && tools.comingSoon).toEqual(comingSoon.tools)
    expect(resources && isNavMenuView(resources) && resources.comingSoon).toEqual(
      comingSoon.resources,
    )
  })

  it("keeps Coaching and adds Dashboard for an admin who isn't a client", () => {
    const entries = buildNavEntries({ client: false, unlocked: true, comingSoon: null })
    expect(titles(entries)).toEqual(["Coaching", "Dashboard", "Gallery", "Tools", "Resources"])
  })

  it("never lets the dashboard into the sitemap", () => {
    expect(publicNavHrefs()).not.toContain("/dashboard")
  })
})
