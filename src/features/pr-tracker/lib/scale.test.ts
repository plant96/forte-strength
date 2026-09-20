import { describe, expect, it } from "vitest"

import { extent, niceTicks, padDomain, project } from "./scale"

describe("project", () => {
  it("maps a domain onto a pixel range", () => {
    expect(project(50, [0, 100], [0, 200])).toBe(100)
    expect(project(0, [0, 100], [0, 200])).toBe(0)
  })

  it("handles an inverted range, which is how SVG y-axes work", () => {
    expect(project(100, [0, 100], [300, 0])).toBe(0)
    expect(project(0, [0, 100], [300, 0])).toBe(300)
  })

  it("puts a flat domain in the middle rather than dividing by zero", () => {
    expect(project(5, [5, 5], [0, 200])).toBe(100)
  })
})

describe("padDomain", () => {
  it("grows a domain by a fraction of its span", () => {
    expect(padDomain([100, 200], 0.1)).toEqual([90, 210])
  })

  it("invents a window around a single value", () => {
    const [min, max] = padDomain([100, 100])
    expect(min).toBeLessThan(100)
    expect(max).toBeGreaterThan(100)
  })
})

describe("extent", () => {
  it("finds min and max", () => {
    expect(extent([3, 1, 4, 1, 5])).toEqual([1, 5])
  })

  it("falls back for an empty list", () => {
    expect(extent([])).toEqual([0, 1])
  })
})

describe("niceTicks", () => {
  it("produces round numbers inside the domain", () => {
    const ticks = niceTicks([90, 210], 5)
    expect(ticks.every((tick) => tick >= 90 && tick <= 210)).toBe(true)
    expect(ticks).toContain(100)
    expect(ticks).toContain(200)
  })

  it("does not drift on fractional steps", () => {
    for (const tick of niceTicks([0, 1], 5)) {
      expect(tick).toBe(Number(tick.toFixed(10)))
    }
  })

  it("degrades to a single tick for a flat domain", () => {
    expect(niceTicks([100, 100])).toEqual([100])
  })
})
