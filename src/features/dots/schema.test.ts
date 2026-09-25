import { describe, expect, it } from "vitest"

import { KG_PER_LB } from "@/lib/units"

import {
  DOTS_FORM_DEFAULTS,
  dotsFormSchema,
  parseDesiredScore,
  toDotsInput,
  type DotsFormInput,
} from "./schema"

const VALID: DotsFormInput = {
  weight: "205",
  weightUnit: "lb",
  total: "1,543",
  totalUnit: "lb",
  age: "30",
  sex: "male",
}

function messages(input: DotsFormInput) {
  const parsed = dotsFormSchema.safeParse(input)
  if (parsed.success) throw new Error("Expected validation errors")
  return Object.fromEntries(parsed.error.issues.map((issue) => [issue.path[0], issue.message]))
}

describe("dotsFormSchema", () => {
  it("asks for every field when the form is empty", () => {
    expect(messages(DOTS_FORM_DEFAULTS)).toEqual({
      weight: "Enter your weight",
      total: "Enter your total",
      age: "Enter your age",
      sex: "Select your sex",
    })
  })

  it("parses a filled-in form, keeping the chosen units", () => {
    expect(dotsFormSchema.parse(VALID)).toEqual({
      weight: 205,
      weightUnit: "lb",
      total: 1543,
      totalUnit: "lb",
      age: 30,
      sex: "male",
    })
  })

  it("limits the total per unit", () => {
    expect(messages({ ...VALID, total: "4000" })).toEqual({ total: "Total must be 45–3,300 lb" })
    expect(messages({ ...VALID, total: "10", totalUnit: "kg" })).toEqual({
      total: "Total must be 20–1,500 kg",
    })
  })

  it("limits age to the coefficient table", () => {
    expect(messages({ ...VALID, age: "12" })).toEqual({ age: "Age must be 14–95 years" })
    expect(messages({ ...VALID, age: "30.5" })).toEqual({ age: "Use a whole number" })
  })
})

describe("toDotsInput", () => {
  it("converts pounds to kilograms", () => {
    const input = toDotsInput(dotsFormSchema.parse(VALID))
    expect(input.bodyweightKg).toBeCloseTo(205 * KG_PER_LB, 10)
    expect(input.totalKg).toBeCloseTo(1543 * KG_PER_LB, 10)
    expect(input).toMatchObject({ ageYears: 30, sex: "male" })
  })

  it("leaves kilograms alone", () => {
    const input = toDotsInput(
      dotsFormSchema.parse({
        ...VALID,
        weightUnit: "kg",
        weight: "93",
        totalUnit: "kg",
        total: "700",
      }),
    )
    expect(input).toMatchObject({ bodyweightKg: 93, totalKg: 700 })
  })
})

describe("parseDesiredScore", () => {
  it("waits while the box is empty", () => {
    expect(parseDesiredScore("", "dots")).toBeNull()
    expect(parseDesiredScore("   ", "glp")).toBeNull()
  })

  it("reads a number", () => {
    expect(parseDesiredScore("500", "dots")).toEqual({ value: 500, error: null })
    expect(parseDesiredScore("87.5", "glp")).toEqual({ value: 87.5, error: null })
  })

  it("rejects text and out-of-range scores per kind", () => {
    expect(parseDesiredScore("abc", "dots")).toEqual({ value: null, error: "Enter a number" })
    expect(parseDesiredScore("2000", "dots")).toEqual({
      value: null,
      error: "Score must be 1–1,500",
    })
    expect(parseDesiredScore("400", "glp")).toEqual({ value: null, error: "Score must be 1–300" })
  })
})
