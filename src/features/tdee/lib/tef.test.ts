import { describe, expect, it } from "vitest"

import { TEF_BY_MACRO, TEF_NOTE } from "./tef"

describe("thermic effect of food", () => {
  it("ranks protein highest and fat lowest", () => {
    expect(TEF_BY_MACRO.protein.min).toBeGreaterThan(TEF_BY_MACRO.carbs.max)
    expect(TEF_BY_MACRO.carbs.min).toBeGreaterThan(TEF_BY_MACRO.fat.max)
  })

  it("doesn't claim a single fixed percentage", () => {
    expect(TEF_NOTE).not.toMatch(/\d+%/)
  })
})
