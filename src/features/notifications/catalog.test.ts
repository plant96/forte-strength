import { describe, expect, it } from "vitest"

import {
  isNotificationKey,
  newlyCrossed,
  NOTIFICATIONS,
  notificationDefault,
  USER_MILESTONES,
  VISITOR_MILESTONES,
} from "./catalog"

describe("notification catalog", () => {
  it("only enables the application email by default", () => {
    const enabled = NOTIFICATIONS.filter((n) => n.defaultEnabled).map((n) => n.key)
    expect(enabled).toEqual(["application-received"])
    expect(notificationDefault("bug-report-received")).toBe(false)
  })

  it("has a unique key and a description on every entry", () => {
    const keys = NOTIFICATIONS.map((n) => n.key)
    expect(new Set(keys).size).toBe(keys.length)
    for (const entry of NOTIFICATIONS) expect(entry.description.length).toBeGreaterThan(10)
    expect(isNotificationKey("weekly-summary")).toBe(true)
    expect(isNotificationKey("nope")).toBe(false)
  })

  it("spells out the milestone thresholds in the descriptions", () => {
    const visitors = NOTIFICATIONS.find((n) => n.key === "visitor-milestones")
    expect(visitors?.description).toContain("100, 500, 1,000, 10,000 and 100,000")
    const users = NOTIFICATIONS.find((n) => n.key === "user-milestones")
    expect(users?.description).toContain("10, 20, 50")
  })
})

describe("newlyCrossed", () => {
  it("returns nothing below the first threshold", () => {
    expect(newlyCrossed(VISITOR_MILESTONES, 99, new Set())).toEqual([])
  })

  it("returns exactly the threshold just reached", () => {
    expect(newlyCrossed(VISITOR_MILESTONES, 100, new Set())).toEqual([100])
    expect(newlyCrossed(VISITOR_MILESTONES, 101, new Set([100]))).toEqual([])
  })

  it("returns every threshold skipped over when enabled late, ascending", () => {
    expect(newlyCrossed(USER_MILESTONES, 120, new Set())).toEqual([10, 20, 50, 100])
    expect(newlyCrossed(USER_MILESTONES, 120, new Set([10, 20]))).toEqual([50, 100])
  })
})
