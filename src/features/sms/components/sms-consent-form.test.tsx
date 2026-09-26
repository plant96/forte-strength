import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

const mocks = vi.hoisted(() => ({ optInToSms: vi.fn() }))

vi.mock("../actions", () => ({ optInToSms: mocks.optInToSms }))

import { SMS_CONSENT_TEXT } from "../consent"
import { SmsConsentForm } from "./sms-consent-form"

beforeEach(() => {
  vi.clearAllMocks()
  mocks.optInToSms.mockResolvedValue({ ok: true })
})

const box = () => screen.getByRole("checkbox")
const submit = () => screen.getByRole("button", { name: /yes, text me updates/i })

describe("SmsConsentForm", () => {
  it("shows the full disclosure beside an unticked box, with the policy links", () => {
    render(<SmsConsentForm id="t" source="settings" />)
    expect(screen.getByText(SMS_CONSENT_TEXT)).toBeInTheDocument()
    expect(box()).not.toBeChecked()
    expect(screen.getByRole("link", { name: "Terms of Service" })).toHaveAttribute("href", "/terms")
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy")
  })

  it("won't send until the box is ticked", async () => {
    const user = userEvent.setup()
    render(<SmsConsentForm id="t" source="settings" defaultPhone="(415) 555-2671" />)
    expect(submit()).toBeDisabled()

    await user.click(box())
    expect(submit()).toBeEnabled()
  })

  it("sends the number and consent with its source, then reports success", async () => {
    const user = userEvent.setup()
    const onOptedIn = vi.fn()
    render(<SmsConsentForm id="t" source="dashboard" onOptedIn={onOptedIn} />)

    await user.type(screen.getByLabelText("Mobile phone number"), "415 555 2671")
    await user.click(box())
    await user.click(submit())

    expect(mocks.optInToSms).toHaveBeenCalledWith(
      { phone: "415 555 2671", consent: true },
      "dashboard",
    )
    expect(onOptedIn).toHaveBeenCalled()
  })

  it("stops a number it can't text before it reaches the server", async () => {
    const user = userEvent.setup()
    render(<SmsConsentForm id="t" source="settings" />)

    await user.type(screen.getByLabelText("Mobile phone number"), "12345")
    await user.click(box())
    await user.click(submit())

    expect(await screen.findByText("Enter a 10-digit US or Canadian number")).toBeInTheDocument()
    expect(mocks.optInToSms).not.toHaveBeenCalled()
  })

  it("shows everything but allows nothing in preview", () => {
    render(
      <SmsConsentForm
        id="t"
        source="sms-page"
        preview
        previewAction={<button type="button">Sign in to turn on texts</button>}
      />,
    )
    expect(screen.getByText(SMS_CONSENT_TEXT)).toBeInTheDocument()
    expect(screen.getByLabelText("Mobile phone number")).toBeDisabled()
    expect(box()).toBeDisabled()
    expect(screen.queryByRole("button", { name: /yes, text me updates/i })).toBeNull()
    expect(screen.getByRole("button", { name: "Sign in to turn on texts" })).toBeInTheDocument()
  })
})
