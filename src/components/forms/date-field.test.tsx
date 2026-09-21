import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useState } from "react"
import { describe, expect, it, vi } from "vitest"

import { DateField } from "./date-field"

/**
 * Drives the field the way a form does: the value lives in state above it, so what the
 * field reports through `onChange` is what it is shown next.
 */
function renderField(initial: string) {
  const onChange = vi.fn()
  const onDismiss = vi.fn()

  function Harness() {
    const [value, setValue] = useState(initial)
    return (
      <DateField
        label="Date"
        value={value}
        onChange={(day) => {
          onChange(day)
          setValue(day)
        }}
        onDismiss={onDismiss}
      />
    )
  }

  render(<Harness />)
  return { user: userEvent.setup(), onChange, onDismiss }
}

const trigger = () => screen.getByRole("button", { name: "Date" })

describe("DateField", () => {
  it("unselects the day on open but still opens on its month", async () => {
    const { user, onChange } = renderField("2026-09-10")
    expect(trigger()).toHaveTextContent("Sep 10, 2026")

    await user.click(trigger())

    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledWith("")
    expect(trigger()).toHaveTextContent("Pick a date")
    expect(screen.getByRole("combobox", { name: "Month" })).toHaveTextContent("September")
    expect(screen.getByRole("combobox", { name: "Year" })).toHaveTextContent("2026")
    expect(screen.queryByRole("button", { pressed: true })).not.toBeInTheDocument()
  })

  it("reports a close without a pick, and a pick without a dismiss", async () => {
    const { user, onChange, onDismiss } = renderField("2026-09-10")

    await user.click(trigger())
    await user.keyboard("{Escape}")
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(onChange).toHaveBeenCalledTimes(1)

    await user.click(trigger())
    // Nothing was selected, so there is nothing to clear this time.
    expect(onChange).toHaveBeenCalledTimes(1)
    await user.click(screen.getByRole("button", { name: "12" }))

    expect(onChange).toHaveBeenLastCalledWith("2026-09-12")
    expect(onDismiss).toHaveBeenCalledTimes(1)
    expect(trigger()).toHaveTextContent("Sep 12, 2026")
  })

  it("reopens on the month they paged to before closing", async () => {
    const { user } = renderField("2026-09-10")

    await user.click(trigger())
    await user.click(screen.getByRole("button", { name: "Previous month" }))
    await user.keyboard("{Escape}")
    await user.click(trigger())

    expect(screen.getByRole("combobox", { name: "Month" })).toHaveTextContent("August")
  })

  it("has nothing to clear when no day was chosen", async () => {
    const { user, onChange } = renderField("")

    await user.click(trigger())

    expect(onChange).not.toHaveBeenCalled()
  })
})
