import { describe, expect, it } from "vitest"

import { checkRecord, currentRecord, type RecordPoint } from "./records"

/** 1 Aug at 100 kg, 1 Sep at 110 kg — a two-point climbing line. */
const line: RecordPoint[] = [
  { id: "a", weightKg: 100, achievedOn: "2026-08-01" },
  { id: "b", weightKg: 110, achievedOn: "2026-09-01" },
]

describe("checkRecord", () => {
  it("accepts the first entry on an empty series", () => {
    const verdict = checkRecord([], { weightKg: 60, achievedOn: "2026-08-01" })
    expect(verdict).toMatchObject({ ok: true, placement: "first", previous: null })
  })

  it("accepts a heavier weight at the end of the line", () => {
    const verdict = checkRecord(line, { weightKg: 112.5, achievedOn: "2026-10-01" })
    expect(verdict).toMatchObject({ ok: true, placement: "append" })
    if (verdict.ok) expect(verdict.previous?.id).toBe("b")
  })

  it("rejects an appended weight that does not beat the record", () => {
    const verdict = checkRecord(line, { weightKg: 105, achievedOn: "2026-10-01" })
    expect(verdict).toMatchObject({ ok: false, reason: "not-heavier" })
  })

  it("rejects an appended weight equal to the record", () => {
    const verdict = checkRecord(line, { weightKg: 110, achievedOn: "2026-10-01" })
    expect(verdict).toMatchObject({ ok: false, reason: "not-heavier" })
  })

  it("accepts a back-fill that keeps the line climbing", () => {
    const verdict = checkRecord(line, { weightKg: 105, achievedOn: "2026-08-15" })
    expect(verdict).toMatchObject({ ok: true, placement: "backfill" })
    if (verdict.ok) {
      expect(verdict.previous?.id).toBe("a")
      expect(verdict.next?.id).toBe("b")
    }
  })

  it("rejects a back-fill lighter than the record before it", () => {
    const verdict = checkRecord(line, { weightKg: 95, achievedOn: "2026-08-15" })
    expect(verdict).toMatchObject({ ok: false, reason: "between" })
  })

  it("rejects a back-fill heavier than the record after it", () => {
    const verdict = checkRecord(line, { weightKg: 115, achievedOn: "2026-08-15" })
    expect(verdict).toMatchObject({ ok: false, reason: "between" })
  })

  it("accepts a back-fill before the earliest record when it is lighter", () => {
    const verdict = checkRecord(line, { weightKg: 90, achievedOn: "2026-07-01" })
    expect(verdict).toMatchObject({ ok: true, placement: "backfill" })
    if (verdict.ok) {
      expect(verdict.previous).toBeNull()
      expect(verdict.next?.id).toBe("a")
    }
  })

  it("rejects a back-fill before the earliest record that is not lighter", () => {
    const verdict = checkRecord(line, { weightKg: 100, achievedOn: "2026-07-01" })
    expect(verdict).toMatchObject({ ok: false, reason: "not-lighter" })
  })

  it("stacks a second record on a day that already has one", () => {
    // Hitting a PR and then beating it again the same session: two points, one date.
    const verdict = checkRecord(line, { weightKg: 112.5, achievedOn: "2026-09-01" })
    expect(verdict).toMatchObject({ ok: true, placement: "append" })
    if (verdict.ok) expect(verdict.previous?.id).toBe("b")
  })

  it("holds a same-day record to the one already logged that day", () => {
    const verdict = checkRecord(line, { weightKg: 105, achievedOn: "2026-09-01" })
    expect(verdict).toMatchObject({ ok: false, reason: "not-heavier" })
  })

  it("treats a same-day record as coming after every record on that day", () => {
    const sameDay: RecordPoint[] = [
      { id: "a", weightKg: 100, achievedOn: "2026-08-01" },
      { id: "b", weightKg: 105, achievedOn: "2026-08-01" },
      { id: "c", weightKg: 110, achievedOn: "2026-09-01" },
    ]
    // Must beat the last of 1 Aug (105), not the first (100).
    expect(checkRecord(sameDay, { weightKg: 103, achievedOn: "2026-08-01" })).toMatchObject({
      ok: false,
      reason: "between",
    })
    expect(checkRecord(sameDay, { weightKg: 107, achievedOn: "2026-08-01" })).toMatchObject({
      ok: true,
      placement: "backfill",
    })
  })

  it("tolerates float noise from a lb -> kg conversion", () => {
    const converted = 225 * 0.45359237
    const entries: RecordPoint[] = [{ id: "a", weightKg: converted, achievedOn: "2026-08-01" }]
    const verdict = checkRecord(entries, {
      weightKg: 225 * 0.45359237,
      achievedOn: "2026-09-01",
    })
    expect(verdict).toMatchObject({ ok: false, reason: "not-heavier" })
  })
})

describe("currentRecord", () => {
  it("is the latest point on a climbing line", () => {
    expect(currentRecord(line)?.id).toBe("b")
  })

  it("is null for an empty series", () => {
    expect(currentRecord([])).toBeNull()
  })
})
