import { describe, expect, it } from "vitest"

import {
  AGE_GROUPS,
  ageGroupFor,
  DEFAULT_LIFT_FILTERS,
  defaultLiftFilters,
  filtersKey,
  WEIGHT_CLASSES,
  weightClassFor,
} from "./groups"

describe("ageGroupFor", () => {
  it.each([
    [13, null],
    [14, "teen1"],
    [15, "teen1"],
    [16, "teen2"],
    [17, "teen2"],
    [18, "teen3"],
    [19, "teen3"],
    [20, "junior"],
    [23, "junior"],
    [24, "open"],
    [39, "open"],
    [40, "masters"],
    [75, "masters"],
  ])("puts age %i in %s", (age, group) => {
    expect(ageGroupFor(age)).toBe(group)
  })

  it("lists the groups in the order the picker shows them", () => {
    expect(AGE_GROUPS.map((group) => group.short)).toEqual([
      "Teen 1",
      "Teen 2",
      "Teen 3",
      "JR",
      "Open",
      "Masters",
    ])
  })
})

describe("weightClassFor", () => {
  it.each([
    [47, "59"],
    [59, "59"],
    [59.1, "67.5"],
    [62, "67.5"],
    [67.5, "67.5"],
    [75, "75"],
    [83, "83"],
    [93, "93"],
    [110, "110"],
    [110.1, "110+"],
    [150, "110+"],
  ])("puts %s kg in the %s class", (kg, weightClass) => {
    expect(weightClassFor(kg)).toBe(weightClass)
  })

  it("labels every class with the limits it merges", () => {
    expect(WEIGHT_CLASSES.map((weightClass) => weightClass.label)).toEqual([
      "52–59 kg",
      "66–67.5 kg",
      "74–75 kg",
      "82.5–83 kg",
      "90–93 kg",
      "100–110 kg",
      "120–125 kg+",
    ])
  })
})

describe("defaultLiftFilters", () => {
  it("falls back to the defaults for visitors", () => {
    expect(defaultLiftFilters(null)).toEqual(DEFAULT_LIFT_FILTERS)
  })

  it("starts a lifter on their own group and class", () => {
    expect(defaultLiftFilters({ ageYears: 45, bodyweightKg: 92 })).toEqual({
      ageGroup: "masters",
      weightClass: "93",
      lift: "squat",
    })
  })

  it("keeps the default group for a lifter too young for any", () => {
    expect(defaultLiftFilters({ ageYears: 12, bodyweightKg: 45 })).toEqual({
      ageGroup: "open",
      weightClass: "59",
      lift: "squat",
    })
  })
})

describe("filtersKey", () => {
  it("is stable for equal filters and distinct otherwise", () => {
    expect(filtersKey(DEFAULT_LIFT_FILTERS)).toBe(filtersKey({ ...DEFAULT_LIFT_FILTERS }))
    expect(filtersKey({ ...DEFAULT_LIFT_FILTERS, lift: "bench" })).not.toBe(
      filtersKey(DEFAULT_LIFT_FILTERS),
    )
  })
})
