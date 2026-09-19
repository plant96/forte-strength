import { describe, expect, it } from "vitest"

import { calculateActivity, stepComponent, stepRatio, trainingComponent } from "./activity"

const INTENSITY = { moderate: 0.6, hard: 0.8, veryHard: 1 } as const

const multiplier = (steps: number, sessions: number, intensity: number) =>
  calculateActivity({ stepsPerDay: steps, sessionsPerWeek: sessions, intensityScore: intensity })
    .multiplier

describe("step component S", () => {
  it.each([
    [0, 0.0],
    [2_000, 0.072],
    [5_000, 0.156],
    [8_000, 0.218],
    [10_000, 0.25],
    [12_000, 0.276],
    [15_000, 0.307],
    [18_000, 0.33],
  ])("%i steps/day → %f", (steps, expected) => {
    expect(stepComponent(stepRatio(steps))).toBeCloseTo(expected, 3)
  })

  it("stops increasing past 18,000 steps", () => {
    expect(stepComponent(stepRatio(30_000))).toBeCloseTo(0.33, 10)
  })
})

describe("training component T", () => {
  const t = (sessions: number, intensity: number) =>
    calculateActivity({ stepsPerDay: 0, sessionsPerWeek: sessions, intensityScore: intensity }).t

  it.each([
    [1, INTENSITY.moderate, 0.109],
    [2, INTENSITY.moderate, 0.2],
    [3, INTENSITY.moderate, 0.274],
    [4, INTENSITY.moderate, 0.336],
    [5, INTENSITY.moderate, 0.387],
    [3, INTENSITY.hard, 0.336],
    [4, INTENSITY.hard, 0.401],
    [5, INTENSITY.hard, 0.452],
    [3, INTENSITY.veryHard, 0.387],
    [4, INTENSITY.veryHard, 0.452],
    [5, INTENSITY.veryHard, 0.5],
    [6, INTENSITY.veryHard, 0.5],
    [7, INTENSITY.veryHard, 0.5],
  ])("%i sessions at I=%f → %f", (sessions, intensity, expected) => {
    expect(t(sessions, intensity)).toBeCloseTo(expected, 3)
  })

  it("is zero with no training", () => {
    expect(trainingComponent(0)).toBe(0)
  })
})

describe("activity multiplier M", () => {
  it.each([
    [0, 0, 0, 1.01],
    [2_000, 0, 0, 1.082],
    [5_000, 3, INTENSITY.moderate, 1.43],
    [8_000, 4, INTENSITY.moderate, 1.546],
    [10_000, 4, INTENSITY.hard, 1.637],
    [12_000, 5, INTENSITY.hard, 1.708],
    [15_000, 5, INTENSITY.veryHard, 1.78],
    [18_000, 5, INTENSITY.veryHard, 1.8],
    [18_000, 7, INTENSITY.veryHard, 1.8],
  ])("%i steps, %i sessions at I=%f → %f", (steps, sessions, intensity, expected) => {
    expect(multiplier(steps, sessions, intensity)).toBeCloseTo(expected, 3)
  })

  it("never leaves the 1.01–1.80 range", () => {
    expect(multiplier(0, 0, 0)).toBeGreaterThanOrEqual(1.01)
    expect(multiplier(100_000, 14, 1)).toBeLessThanOrEqual(1.8)
  })

  it("flags when caps kick in", () => {
    const result = calculateActivity({ stepsPerDay: 20_000, sessionsPerWeek: 6, intensityScore: 1 })
    expect(result.stepsCapped).toBe(true)
    expect(result.sessionsCapped).toBe(true)
    expect(result.multiplierClamped).toBe(false)
  })
})
