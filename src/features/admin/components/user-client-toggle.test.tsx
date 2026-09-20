import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { setUserClient } from "../actions"
import { UserClientToggle } from "./user-client-toggle"

vi.mock("../actions", () => ({ setUserClient: vi.fn() }))

describe("UserClientToggle", () => {
  beforeEach(() => {
    vi.mocked(setUserClient).mockReset()
    vi.mocked(setUserClient).mockResolvedValue({ ok: true })
  })

  it("makes a user a client", async () => {
    const user = userEvent.setup()
    render(<UserClientToggle id="user_1" client={false} />)

    await user.click(screen.getByRole("button", { name: "Make client" }))

    await vi.waitFor(() => expect(setUserClient).toHaveBeenCalledWith("user_1", true))
    await vi.waitFor(() => expect(screen.getByRole("button")).toBeEnabled())
  })

  it("removes client status from a client", async () => {
    const user = userEvent.setup()
    render(<UserClientToggle id="user_1" client />)

    await user.click(screen.getByRole("button", { name: "Remove client" }))

    await vi.waitFor(() => expect(setUserClient).toHaveBeenCalledWith("user_1", false))
  })
})
