import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it } from "vitest"

import { MainNav } from "./main-nav"

/**
 * Radix's navigation menu opens after a 200ms hover delay and closes after a 150ms
 * one, and its dismissable layer registers the outside-pointer listener in a deferred
 * task. These run on real timers — userEvent deadlocks against Vitest's fake ones —
 * so the assertions poll instead.
 */
function setup() {
  const user = userEvent.setup()
  render(<MainNav />)
  return user
}

const tools = () => screen.getByRole("button", { name: /^Tools/ })
const resources = () => screen.getByRole("button", { name: /^Resources/ })

/** Radix drives `aria-expanded` straight off the menu's open value. */
const isOpen = (trigger: HTMLElement) => trigger.getAttribute("aria-expanded") === "true"

const opens = (trigger: () => HTMLElement) => waitFor(() => expect(isOpen(trigger())).toBe(true))
const closes = (trigger: () => HTMLElement) => waitFor(() => expect(isOpen(trigger())).toBe(false))

/** Long enough for both delays to have fired, for asserting something did *not* happen. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 400))

describe("MainNav dropdowns", () => {
  it("renders a trigger for every menu and a link for every plain entry", () => {
    setup()

    expect(tools()).toBeInTheDocument()
    expect(resources()).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Coaching" })).toHaveAttribute("href", "/")
    expect(screen.getByRole("link", { name: "Gallery" })).toHaveAttribute("href", "/gallery")
  })

  it("opens on hover and closes again when the pointer leaves", async () => {
    const user = setup()

    await user.hover(tools())
    await opens(tools)

    await user.unhover(tools())
    await closes(tools)
  })

  it("stays open after a click, and the pointer leaving no longer closes it", async () => {
    const user = setup()

    await user.hover(tools())
    await opens(tools)
    await user.click(tools())

    expect(tools()).toHaveAttribute("data-pinned")

    await user.unhover(tools())
    await settle()
    expect(isOpen(tools())).toBe(true)
  })

  it("closes when the pinned trigger is clicked a second time", async () => {
    const user = setup()

    await user.hover(tools())
    await opens(tools)
    await user.click(tools())
    expect(isOpen(tools())).toBe(true)

    await user.click(tools())
    await closes(tools)
    expect(tools()).not.toHaveAttribute("data-pinned")
  })

  it("pins a menu clicked open from cold, without hovering first", async () => {
    const user = setup()

    await user.click(tools())
    await opens(tools)
    expect(tools()).toHaveAttribute("data-pinned")

    await user.unhover(tools())
    await settle()
    expect(isOpen(tools())).toBe(true)
  })

  it("closes a pinned menu when something else on the page is clicked", async () => {
    const user = setup()

    await user.click(tools())
    await opens(tools)

    await user.click(document.body)
    await closes(tools)
    expect(tools()).not.toHaveAttribute("data-pinned")
  })

  it("closes a pinned menu on Escape", async () => {
    const user = setup()

    await user.click(tools())
    await opens(tools)

    await user.keyboard("{Escape}")
    await closes(tools)
    expect(tools()).not.toHaveAttribute("data-pinned")
  })

  it("drops the pin when the other menu is hovered", async () => {
    const user = setup()

    await user.click(tools())
    await opens(tools)
    expect(tools()).toHaveAttribute("data-pinned")

    await user.hover(resources())
    await opens(resources)
    expect(isOpen(tools())).toBe(false)
    expect(resources()).not.toHaveAttribute("data-pinned")

    // Unpinned, so it follows the pointer back out.
    await user.unhover(resources())
    await closes(resources)
  })

  it("closes and unpins once a link inside the menu is chosen", async () => {
    const user = setup()

    await user.click(resources())
    await opens(resources)

    await user.click(await screen.findByRole("link", { name: /Squat/ }))

    await closes(resources)
    expect(resources()).not.toHaveAttribute("data-pinned")
  })
})
