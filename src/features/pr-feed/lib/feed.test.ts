import { describe, expect, it } from "vitest"

import type { CompetitionLift } from "@/features/pr-tracker/lib/lifts"
import { lbToKg } from "@/lib/units"

import {
  buildFeed,
  headlineWords,
  prSentence,
  sentenceText,
  type FeedPr,
  type FeedRow,
} from "./feed"

type RowOverrides = Partial<Omit<FeedRow, "series">> & { series?: Partial<FeedRow["series"]> }

function row(overrides: RowOverrides = {}): FeedRow {
  const { series, ...rest } = overrides
  return {
    id: "e-1",
    userId: "u-jim",
    weightKg: lbToKg(240),
    achievedOn: new Date("2026-09-24T00:00:00Z"),
    user: { firstName: "Jim", lastName: "Reyes" },
    ...rest,
    series: {
      kind: "REP",
      sets: 1,
      reps: 4,
      exerciseId: "x-bench",
      entries: [],
      ...series,
    },
  }
}

const LIFTS = new Map<string, CompetitionLift>([
  ["x-bench", "bench"],
  ["x-squat", "squat"],
])

function pr(overrides: Partial<FeedPr> = {}): FeedPr {
  return {
    id: "e-1",
    name: "Jim R.",
    mine: false,
    lift: "bench",
    shape: { kind: "rep", sets: 1, reps: 4 },
    weightKg: lbToKg(240),
    gainKg: null,
    achievedOn: "2026-09-24",
    ...overrides,
  }
}

const sentence = (feedPr: FeedPr, now: string | null = "2026-09-25", unit: "lb" | "kg" = "lb") =>
  sentenceText(prSentence(feedPr, unit, now))

describe("buildFeed", () => {
  it("names the lifter the leaderboard way and maps the series shape", () => {
    const [slide] = buildFeed([row()], LIFTS, "u-viewer")
    expect(slide).toMatchObject({
      id: "e-1",
      name: "Jim R.",
      mine: false,
      lift: "bench",
      shape: { kind: "rep", sets: 1, reps: 4 },
      achievedOn: "2026-09-24",
    })
  })

  it("marks the viewer's own PRs", () => {
    expect(buildFeed([row()], LIFTS, "u-jim")[0]?.mine).toBe(true)
  })

  it("keeps the query's order and drops anything that isn't a competition lift", () => {
    const rows = [
      row({ id: "a", series: { exerciseId: "x-squat" } }),
      row({ id: "b", series: { exerciseId: "x-front-squat" } }),
      row({ id: "c" }),
    ]
    expect(buildFeed(rows, LIFTS, "u-viewer").map((slide) => slide.id)).toEqual(["a", "c"])
  })

  it("measures the gain over the record before it, wherever that sits on the series", () => {
    const [slide] = buildFeed(
      [
        row({
          id: "e-3",
          weightKg: 110,
          series: {
            entries: [
              { id: "e-1", weightKg: 100 },
              { id: "e-2", weightKg: 105 },
              { id: "e-3", weightKg: 110 },
              { id: "e-4", weightKg: 115 },
            ],
          },
        }),
      ],
      LIFTS,
      "u-viewer",
    )
    expect(slide?.gainKg).toBeCloseTo(5)
  })

  it("has no gain for a series' first entry", () => {
    const [slide] = buildFeed(
      [row({ weightKg: 100, series: { entries: [{ id: "e-1", weightKg: 100 }] } })],
      LIFTS,
      "u-viewer",
    )
    expect(slide?.gainKg).toBeNull()
  })

  it("maps each database kind", () => {
    const rows = [
      row({ id: "a", series: { kind: "ONE_REP_MAX", sets: 1, reps: 1 } }),
      row({ id: "b", series: { kind: "VOLUME", sets: 5, reps: 5 } }),
    ]
    expect(buildFeed(rows, LIFTS, "u-viewer").map((slide) => slide.shape.kind)).toEqual([
      "one-rep-max",
      "volume",
    ])
  })
})

describe("prSentence", () => {
  it("words a rep PR", () => {
    expect(sentence(pr())).toBe("Jim R. just hit 240 lb on bench for 4 reps")
  })

  it("words a one-rep max", () => {
    const max = pr({ lift: "squat", shape: { kind: "one-rep-max", sets: 1, reps: 1 } })
    expect(sentence(max)).toBe("Jim R. just hit 240 lb on squat for a new max")
  })

  it("words a volume PR with a real multiplication sign", () => {
    const volume = pr({ lift: "deadlift", shape: { kind: "volume", sets: 5, reps: 5 } })
    expect(sentence(volume)).toBe("Jim R. just hit 240 lb on deadlift for 5×5")
  })

  it("speaks to the viewer about their own PR", () => {
    expect(sentence(pr({ mine: true }))).toBe("You just hit 240 lb on bench for 4 reps")
  })

  it("says 'just' for today and yesterday only", () => {
    expect(sentence(pr({ achievedOn: "2026-09-25" }))).toContain("just hit")
    expect(sentence(pr({ achievedOn: "2026-09-24" }))).toContain("just hit")
    expect(sentence(pr({ achievedOn: "2026-09-22" }))).toBe("Jim R. hit 240 lb on bench for 4 reps")
  })

  it("leaves 'just' out until the viewer's day is known", () => {
    expect(sentence(pr(), null)).toBe("Jim R. hit 240 lb on bench for 4 reps")
  })

  it("shows the weight in the viewer's unit", () => {
    expect(sentence(pr({ weightKg: 102.5 }), "2026-09-25", "kg")).toContain("102.5 kg")
  })

  it("tags the parts the headline colours", () => {
    const tones = prSentence(pr(), "lb", "2026-09-25").map((segment) => segment.tone)
    expect(tones).toEqual(["subject", "plain", "weight", "plain", "lift", "plain"])
  })
})

describe("headlineWords", () => {
  const words = (feedPr: FeedPr) =>
    headlineWords(prSentence(feedPr, "lb", "2026-09-25")).map((word) => word.text)

  it("keeps names and weights whole and the last two words together", () => {
    expect(
      words(pr({ name: "Korbyn B.", shape: { kind: "one-rep-max", sets: 1, reps: 1 } })),
    ).toEqual(["Korbyn B.", "just", "hit", "240 lb", "on", "bench", "for", "a", "new max"])
    expect(words(pr())).toEqual(["Jim R.", "just", "hit", "240 lb", "on", "bench", "for", "4 reps"])
  })

  it("leaves a two-word tail as one piece", () => {
    const volume = pr({ shape: { kind: "volume", sets: 5, reps: 5 } })
    expect(words(volume).at(-1)).toBe("for 5\u00d75")
  })

  it("reads back as the same sentence", () => {
    const segments = prSentence(pr(), "lb", "2026-09-25")
    expect(sentenceText(headlineWords(segments))).toBe(sentenceText(segments))
  })
})
