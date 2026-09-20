import "@testing-library/jest-dom/vitest"

import { configure } from "@testing-library/dom"
import { cleanup } from "@testing-library/react"
import { afterEach, vi } from "vitest"

// `findBy*` and `waitFor` give up after 1s by default. The suite runs a jsdom environment
// per test file in parallel, so on a saturated machine a multi-step form can legitimately
// take longer than that to settle — which showed up as flaky failures rather than real
// ones. Raising the ceiling only changes how long a *failing* query waits; a query that
// will pass still resolves the moment the DOM updates.
configure({ asyncUtilTimeout: 5000 })

afterEach(() => {
  cleanup()
})

// Components render outside the App Router in tests. One stable router object,
// so effects that depend on it don't re-run on every render.
vi.mock("next/navigation", async (importOriginal) => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    refresh: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    prefetch: vi.fn(),
  }
  return {
    ...(await importOriginal<typeof import("next/navigation")>()),
    useRouter: () => router,
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
  }
})

// jsdom gaps that Radix UI and Motion rely on.
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn((query: string) => ({
    // Motion drives enter/exit animations off requestAnimationFrame. In jsdom those
    // frames are slow, and under a suite running a environment per file in parallel they
    // can stall long enough that content behind an `AnimatePresence` never mounts within
    // a query's timeout — a flake, not a real failure. Reporting reduced motion makes
    // Motion settle instantly, which is what a unit test wants from an animation anyway.
    matches: query.includes("prefers-reduced-motion"),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver

Element.prototype.hasPointerCapture ??= () => false
Element.prototype.setPointerCapture ??= () => {}
Element.prototype.releasePointerCapture ??= () => {}
Element.prototype.scrollIntoView ??= () => {}

class IntersectionObserverStub {
  readonly root = null
  readonly rootMargin = ""
  readonly thresholds = []
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}
globalThis.IntersectionObserver ??=
  IntersectionObserverStub as unknown as typeof IntersectionObserver
