import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MotionProvider } from "@/components/motion/motion-provider"

const mocks = vi.hoisted(() => ({ optInToSms: vi.fn(), snoozeSmsPrompt: vi.fn() }))

vi.mock("../actions", () => ({
  optInToSms: mocks.optInToSms,
  snoozeSmsPrompt: mocks.snoozeSmsPrompt,
}))

import type { SmsState } from "../queries"
import { SmsDashboardPrompt } from "./sms-dashboard-prompt"

const OFF: SmsState = {
  optedIn: false,
  phone: null,
  optedInOn: null,
  prefillPhone: "(415) 555-2671",
  promptDue: true,
}

function renderPrompt(state: SmsState) {
  const user = userEvent.setup()
  render(
    <MotionProvider>
      <SmsDashboardPrompt state={state} />
    </MotionProvider>,
  )
  return user
}

beforeEach(() => {
  vi.clearAllMocks()
  mocks.optInToSms.mockResolvedValue({ ok: true })
  mocks.snoozeSmsPrompt.mockResolvedValue({ ok: true })
})

describe("SmsDashboardPrompt", () => {
  it("opens by itself when it's due, with their number already filled in", async () => {
    renderPrompt(OFF)
    const dialog = await screen.findByRole("dialog", { name: "Get training updates by text" })
    expect(dialog).toBeInTheDocument()
    expect(screen.getByLabelText("Mobile phone number")).toHaveValue("(415) 555-2671")
    expect(screen.getByRole("checkbox")).not.toBeChecked()
  })

  it("'Not now' closes it and snoozes it", async () => {
    const user = renderPrompt(OFF)
    await screen.findByRole("dialog")
    await user.click(screen.getByRole("button", { name: "Not now" }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(mocks.snoozeSmsPrompt).toHaveBeenCalledTimes(1)
    // The card stays, so they can still turn texts on later.
    expect(screen.getByRole("button", { name: /turn on texts/i })).toBeInTheDocument()
  })

  it("stays shut when it's snoozed, but the card still opens it", async () => {
    const user = renderPrompt({ ...OFF, promptDue: false })
    await new Promise((resolve) => setTimeout(resolve, 1100))
    expect(screen.queryByRole("dialog")).toBeNull()

    await user.click(screen.getByRole("button", { name: /turn on texts/i }))
    expect(await screen.findByRole("dialog")).toBeInTheDocument()
  })

  it("opting in closes everything without snoozing", async () => {
    const user = renderPrompt(OFF)
    await screen.findByRole("dialog")
    await user.click(screen.getByRole("checkbox"))
    await user.click(screen.getByRole("button", { name: /yes, text me updates/i }))

    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull())
    expect(mocks.optInToSms).toHaveBeenCalledWith(
      { phone: "(415) 555-2671", consent: true },
      "dashboard",
    )
    expect(mocks.snoozeSmsPrompt).not.toHaveBeenCalled()
    expect(screen.queryByRole("button", { name: /turn on texts/i })).toBeNull()
  })

  it("shows nothing to someone already opted in", () => {
    renderPrompt({ ...OFF, optedIn: true, phone: "(415) 555-2671", promptDue: false })
    expect(screen.queryByRole("button", { name: /turn on texts/i })).toBeNull()
  })
})
