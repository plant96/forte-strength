import { describe, expect, it } from "vitest"

import { comingSoonSchema } from "./schema"

describe("comingSoonSchema", () => {
  it("trims the title and accepts both kinds", () => {
    expect(comingSoonSchema.parse({ kind: "tools", title: "  Meet Planner " })).toEqual({
      kind: "tools",
      title: "Meet Planner",
    })
    expect(
      comingSoonSchema.safeParse({ kind: "resources", title: "Warm-up Library" }).success,
    ).toBe(true)
  })

  it("rejects an empty or overlong title and an unknown kind", () => {
    expect(comingSoonSchema.safeParse({ kind: "tools", title: "   " }).success).toBe(false)
    expect(comingSoonSchema.safeParse({ kind: "tools", title: "x".repeat(61) }).success).toBe(false)
    expect(comingSoonSchema.safeParse({ kind: "gear", title: "Belt" }).success).toBe(false)
  })
})
