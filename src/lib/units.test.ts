import { describe, expect, it } from "vitest"

import { cmToFtIn, ftInToCm, kgToLb, lbToKg } from "./units"

describe("unit conversions", () => {
  it("round-trips weight", () => {
    expect(kgToLb(lbToKg(180))).toBeCloseTo(180, 10)
    expect(lbToKg(180)).toBeCloseTo(81.647, 3)
  })

  it("converts feet and inches to cm", () => {
    expect(ftInToCm(5, 10)).toBeCloseTo(177.8, 10)
  })

  it("splits cm into feet and inches", () => {
    expect(cmToFtIn(177.8)).toEqual({ ft: 5, in: 10 })
    expect(cmToFtIn(182.8)).toEqual({ ft: 6, in: 0 })
  })
})
