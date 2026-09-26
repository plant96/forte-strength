import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({
  getClientAreaUser: vi.fn(),
  requireUser: vi.fn(),
  userUpdate: vi.fn(),
  eventCreate: vi.fn(),
  transaction: vi.fn(),
  revalidatePath: vi.fn(),
  headers: vi.fn(),
}))

vi.mock("@/server/auth", () => ({
  getClientAreaUser: mocks.getClientAreaUser,
  requireUser: mocks.requireUser,
}))
vi.mock("@/server/db", () => ({
  db: {
    user: { update: mocks.userUpdate },
    smsConsentEvent: { create: mocks.eventCreate },
    $transaction: mocks.transaction,
  },
}))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))
vi.mock("next/headers", () => ({ headers: mocks.headers }))

import { optInToSms, optOutOfSms, snoozeSmsPrompt } from "./actions"
import { SMS_CONSENT_TEXT, SMS_CONSENT_VERSION } from "./consent"

const CLIENT = { id: "user-1", smsPhone: null as string | null, smsOptInAt: null as Date | null }

beforeEach(() => {
  vi.clearAllMocks()
  mocks.getClientAreaUser.mockResolvedValue(CLIENT)
  mocks.requireUser.mockResolvedValue(CLIENT)
  // Hand back the operations so the test can see what the transaction held.
  mocks.userUpdate.mockImplementation((args: unknown) => ({ op: "user.update", args }))
  mocks.eventCreate.mockImplementation((args: unknown) => ({ op: "event.create", args }))
  mocks.transaction.mockResolvedValue([])
  mocks.headers.mockResolvedValue(
    new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1", "user-agent": "Safari/604.1" }),
  )
})

describe("optInToSms", () => {
  it("stores the number, the exact wording, and who agreed from where", async () => {
    const result = await optInToSms({ phone: "(415) 555-2671", consent: true }, "dashboard")

    expect(result).toEqual({ ok: true })
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { smsPhone: "+14155552671", smsOptInAt: expect.any(Date) },
    })
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        phone: "+14155552671",
        action: "OPT_IN",
        source: "DASHBOARD",
        consentText: SMS_CONSENT_TEXT,
        consentVersion: SMS_CONSENT_VERSION,
        ipAddress: "203.0.113.7",
        userAgent: "Safari/604.1",
      }),
    })
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
    expect(mocks.revalidatePath).toHaveBeenCalledWith("/", "layout")
  })

  it("refuses without the ticked box, even from a direct POST", async () => {
    const result = await optInToSms({ phone: "4155552671", consent: false }, "settings")
    expect(result).toMatchObject({
      ok: false,
      fieldErrors: { consent: "Tick the box to agree to text updates" },
    })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("refuses a number that isn't US or Canadian", async () => {
    const result = await optInToSms({ phone: "+44 20 7946 0958", consent: true }, "settings")
    expect(result).toMatchObject({ ok: false, fieldErrors: { phone: expect.any(String) } })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("is for coaching clients only", async () => {
    mocks.getClientAreaUser.mockResolvedValue(null)
    const result = await optInToSms({ phone: "4155552671", consent: true }, "sms-page")
    expect(result).toEqual({ ok: false, message: "Text updates are for coaching clients." })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("rejects an unknown source", async () => {
    const result = await optInToSms(
      { phone: "4155552671", consent: true },
      "somewhere" as unknown as "settings",
    )
    expect(result.ok).toBe(false)
    expect(mocks.transaction).not.toHaveBeenCalled()
  })

  it("reports a database failure without claiming success", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {})
    mocks.transaction.mockRejectedValue(new Error("db down"))
    const result = await optInToSms({ phone: "4155552671", consent: true }, "dashboard")
    expect(result.ok).toBe(false)
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
    error.mockRestore()
  })
})

describe("optOutOfSms", () => {
  it("turns texts off and records the opt-out", async () => {
    mocks.requireUser.mockResolvedValue({
      ...CLIENT,
      smsPhone: "+14155552671",
      smsOptInAt: new Date(),
    })
    const result = await optOutOfSms("settings")

    expect(result).toEqual({ ok: true })
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { smsOptInAt: null },
    })
    expect(mocks.eventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: "user-1",
        phone: "+14155552671",
        action: "OPT_OUT",
        source: "SETTINGS",
      }),
    })
  })

  it("works for accounts that are no longer clients", async () => {
    mocks.getClientAreaUser.mockResolvedValue(null)
    mocks.requireUser.mockResolvedValue({
      ...CLIENT,
      smsPhone: "+14155552671",
      smsOptInAt: new Date(),
    })
    expect(await optOutOfSms("settings")).toEqual({ ok: true })
    expect(mocks.transaction).toHaveBeenCalledTimes(1)
  })

  it("does nothing when texts are already off", async () => {
    expect(await optOutOfSms("settings")).toEqual({ ok: true })
    expect(mocks.transaction).not.toHaveBeenCalled()
  })
})

describe("snoozeSmsPrompt", () => {
  it("remembers when they said 'Not now'", async () => {
    mocks.userUpdate.mockResolvedValue({})
    expect(await snoozeSmsPrompt()).toEqual({ ok: true })
    expect(mocks.userUpdate).toHaveBeenCalledWith({
      where: { id: "user-1" },
      data: { smsPromptSnoozedAt: expect.any(Date) },
    })
  })
})
