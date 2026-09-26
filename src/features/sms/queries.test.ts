import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ findFirst: vi.fn() }))

vi.mock("@/server/db", () => ({ db: { application: { findFirst: mocks.findFirst } } }))

import { getSmsState } from "./queries"

const NOW = new Date("2026-09-26T12:00:00Z")
const BASE = {
  email: "client@example.com",
  smsPhone: null as string | null,
  smsOptInAt: null as Date | null,
  smsPromptSnoozedAt: null as Date | null,
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.findFirst.mockResolvedValue(null)
})

describe("getSmsState", () => {
  it("prefills the number from their coaching application", async () => {
    mocks.findFirst.mockResolvedValue({ phone: "415.555.2671" })
    const state = await getSmsState(BASE, NOW)

    expect(mocks.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: { equals: "client@example.com", mode: "insensitive" } },
      }),
    )
    expect(state).toEqual({
      optedIn: false,
      phone: null,
      optedInOn: null,
      prefillPhone: "(415) 555-2671",
      promptDue: true,
    })
  })

  it("ignores an application number that can't be texted", async () => {
    mocks.findFirst.mockResolvedValue({ phone: "+44 20 7946 0958" })
    expect((await getSmsState(BASE, NOW)).prefillPhone).toBe("")
  })

  it("prefers the number they already gave for texts", async () => {
    const state = await getSmsState({ ...BASE, smsPhone: "+14155550199" }, NOW)
    expect(mocks.findFirst).not.toHaveBeenCalled()
    expect(state.prefillPhone).toBe("(415) 555-0199")
  })

  it("describes an opted-in account and never prompts it", async () => {
    const state = await getSmsState(
      { ...BASE, smsPhone: "+14155550199", smsOptInAt: new Date("2026-09-20T15:00:00Z") },
      NOW,
    )
    expect(state).toMatchObject({
      optedIn: true,
      phone: "(415) 555-0199",
      optedInOn: expect.stringContaining("2026"),
      promptDue: false,
    })
  })

  it("still works when the application lookup fails", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.findFirst.mockRejectedValue(new Error("db down"))
    expect((await getSmsState(BASE, NOW)).prefillPhone).toBe("")
    error.mockRestore()
  })
})
