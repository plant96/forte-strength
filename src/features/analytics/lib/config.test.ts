import { describe, expect, it } from "vitest"

import { parseRetentionDays } from "./config"

describe("retention configuration", () => {
  it.each([undefined, "", "0", "-1", "abc", "Infinity", "1.5", "3651"])(
    "uses 90 days for unsafe configuration %s",
    (value) => expect(parseRetentionDays(value)).toBe(90),
  )

  it.each(["1", "30", "90", "3650"])("accepts %s days", (value) => {
    expect(parseRetentionDays(value)).toBe(Number(value))
  })
})
