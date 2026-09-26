import { describe, expect, it } from "vitest"

import { formatUsPhone, normalizeUsPhone } from "./phone"

describe("normalizeUsPhone", () => {
  it.each([
    ["4155552671", "+14155552671"],
    ["(415) 555-2671", "+14155552671"],
    ["415.555.2671", "+14155552671"],
    ["415 555 2671", "+14155552671"],
    ["1 415 555 2671", "+14155552671"],
    ["+1 (415) 555-2671", "+14155552671"],
    ["  +14155552671  ", "+14155552671"],
  ])("reads %s", (input, expected) => {
    expect(normalizeUsPhone(input)).toBe(expected)
  })

  it.each([
    ["", "empty"],
    ["415555267", "nine digits"],
    ["41555526710", "eleven digits not starting with 1"],
    ["+44 20 7946 0958", "a UK number"],
    ["0155552671", "an area code starting with 0"],
    ["1155552671", "an area code starting with 1"],
    ["4150552671", "an exchange starting with 0"],
    ["415-555-2671 ext 2", "letters"],
  ])("rejects %s (%s)", (input) => {
    expect(normalizeUsPhone(input)).toBeNull()
  })
})

describe("formatUsPhone", () => {
  it("shows a stored number the familiar way", () => {
    expect(formatUsPhone("+14155552671")).toBe("(415) 555-2671")
  })

  it("leaves anything unexpected alone", () => {
    expect(formatUsPhone("+442079460958")).toBe("+442079460958")
  })
})
