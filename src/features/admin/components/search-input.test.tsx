import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

const navigation = vi.hoisted(() => ({
  query: "",
  replace: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  usePathname: () => "/admin/analytics",
  useRouter: () => ({ replace: navigation.replace }),
  useSearchParams: () => new URLSearchParams(navigation.query),
}))

import { SearchInput } from "./search-input"

beforeEach(() => {
  vi.useFakeTimers()
  navigation.query = "range=7d&bots=1&page=3&q=old"
  navigation.replace.mockClear()
})

afterEach(() => vi.useRealTimers())

describe("SearchInput", () => {
  it("preserves filters while debouncing search and resetting pagination", () => {
    render(<SearchInput label="Search visits" placeholder="Search" />)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "Tampa" } })
    expect(navigation.replace).not.toHaveBeenCalled()
    act(() => vi.advanceTimersByTime(300))
    expect(navigation.replace).toHaveBeenCalledWith("/admin/analytics?range=7d&bots=1&q=Tampa")
  })

  it("reflects URL navigation without remounting or losing input focus", () => {
    const { rerender } = render(<SearchInput label="Search visits" placeholder="Search" />)
    const input = screen.getByRole("searchbox")
    input.focus()
    navigation.query = "q=earlier"
    rerender(<SearchInput label="Search visits" placeholder="Search" />)
    expect(input).toHaveValue("earlier")
    expect(input).toHaveFocus()
  })

  it("cancels a stale pending search after URL navigation", () => {
    const { rerender } = render(<SearchInput label="Search visits" placeholder="Search" />)
    fireEvent.change(screen.getByRole("searchbox"), { target: { value: "pending" } })
    navigation.query = "q=earlier"
    rerender(<SearchInput label="Search visits" placeholder="Search" />)
    act(() => vi.advanceTimersByTime(300))
    expect(navigation.replace).not.toHaveBeenCalled()
  })
})
