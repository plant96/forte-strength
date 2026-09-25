import { describe, expect, it } from "vitest"

import { initialsFor, leaderboardName } from "./name"

describe("leaderboardName", () => {
  it("shows the first name and last initial", () => {
    expect(leaderboardName("Tyler", "Montano")).toBe("Tyler M.")
    expect(leaderboardName("  Tyler ", " montano")).toBe("Tyler M.")
  })

  it("falls back to the first name alone", () => {
    expect(leaderboardName("Tyler", null)).toBe("Tyler")
    expect(leaderboardName("Tyler", "  ")).toBe("Tyler")
  })

  it("never shows a bare last name or an email", () => {
    expect(leaderboardName(null, "Montano")).toBe("Athlete")
    expect(leaderboardName("", "")).toBe("Athlete")
    expect(leaderboardName(undefined, undefined)).toBe("Athlete")
  })
})

describe("initialsFor", () => {
  it("takes one letter from each name", () => {
    expect(initialsFor("Tyler", "Montano")).toBe("TM")
    expect(initialsFor("élodie", "durand")).toBe("ÉD")
  })

  it("uses what it has", () => {
    expect(initialsFor("Tyler", null)).toBe("T")
    expect(initialsFor(null, "Montano")).toBe("A")
    expect(initialsFor(" ", "")).toBe("A")
  })
})
