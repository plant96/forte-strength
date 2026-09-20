import { describe, expect, it } from "vitest"

import { cleanName, compactName, levenshtein, matchName, slugify } from "./slug"

describe("slugify", () => {
  it("lowercases, trims and hyphenates", () => {
    expect(slugify("  Bulgarian  Split Squat ")).toBe("bulgarian-split-squat")
  })

  it("strips punctuation and accents", () => {
    expect(slugify("Z-Press (behind neck)")).toBe("z-press-behind-neck")
    expect(slugify("Jefferson Curl")).toBe("jefferson-curl")
  })
})

describe("compactName", () => {
  it("collapses every separator, so punctuation can't create a duplicate", () => {
    for (const written of [
      "Bench Press",
      "bench-press",
      "BENCH  PRESS",
      "benchpress",
      "Bench_Press",
    ]) {
      expect(compactName(written)).toBe("benchpress")
    }
  })
})

describe("cleanName", () => {
  it("keeps the user's capitalisation but tidies whitespace", () => {
    expect(cleanName("  Close   Grip Bench  ")).toBe("Close Grip Bench")
  })
})

describe("levenshtein", () => {
  it("counts single edits", () => {
    expect(levenshtein("benchpress", "benchpres")).toBe(1)
    expect(levenshtein("squat", "squat")).toBe(0)
    expect(levenshtein("", "abc")).toBe(3)
  })
})

describe("matchName", () => {
  const existing = [{ name: "Bench Press" }, { name: "Barbell Row" }, { name: "Curl" }]

  it("treats punctuation-only differences as the same movement", () => {
    expect(matchName("benchpress", existing)).toMatchObject({ kind: "exact" })
    expect(matchName("BENCH  PRESS", existing)).toMatchObject({ kind: "exact" })
  })

  it("flags a likely typo for confirmation", () => {
    const result = matchName("Bench Pres", existing)
    expect(result.kind).toBe("near")
    if (result.kind === "near") expect(result.matches[0].name).toBe("Bench Press")
  })

  it("leaves a genuinely different movement alone", () => {
    expect(matchName("Overhead Press", existing)).toMatchObject({ kind: "none" })
  })

  it("does not confuse two short names that differ by a letter", () => {
    // "Curl" vs "Hurl" is one edit, but at four characters that is a different word.
    expect(matchName("Hurl", existing)).toMatchObject({ kind: "none" })
  })

  it("does not flag a longer variation as a duplicate of its base lift", () => {
    expect(matchName("Close Grip Bench Press", existing)).toMatchObject({ kind: "none" })
  })
})
