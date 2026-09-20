import { render, screen, waitForElementToBeRemoved } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { afterEach, describe, expect, it } from "vitest"
import { toast } from "sonner"

import { Toaster } from "./sonner"

describe("Toaster", () => {
  // Toasts live in a module-level store that outlasts each render.
  afterEach(() => {
    toast.dismiss()
  })

  it("gives every toast a close button that dismisses it", async () => {
    const user = userEvent.setup()
    render(<Toaster />)

    toast.success("Profile saved")
    expect(await screen.findByText("Profile saved")).toBeInTheDocument()

    const close = await screen.findByRole("button", { name: "Dismiss notification" })
    await user.click(close)

    await waitForElementToBeRemoved(() => screen.queryByText("Profile saved"))
  })

  it("leaves a toast's own action button reachable alongside it", async () => {
    render(<Toaster />)

    toast("Autofilled from your profile", {
      action: { label: "Settings", onClick: () => {} },
    })

    expect(await screen.findByRole("button", { name: "Settings" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Dismiss notification" })).toBeInTheDocument()
  })
})
