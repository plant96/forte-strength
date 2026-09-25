"use client"

/** The panel's scroll container and sticky toolbar, which the jump nav measures against. */
export const BREAKDOWN_SCROLL_ID = "breakdown-scroll"
export const BREAKDOWN_TOOLBAR_ID = "breakdown-toolbar"

export interface JumpNavItem {
  id: string
  label: string
}

/** Pill buttons that scroll the panel to each section. */
export function JumpNav({ items }: { items: readonly JumpNavItem[] }) {
  return (
    <nav aria-label="Jump to a step" className="-mx-5 overflow-x-auto px-5">
      <ul className="flex w-max gap-1.5">
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              onClick={() => scrollToSection(item.id)}
              className="rounded-full px-3 py-1 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              {item.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  )
}

/** Scrolls the panel so a section starts just below the sticky toolbar (whose height varies). */
export function scrollToSection(id: string) {
  const section = document.getElementById(`breakdown-${id}`)
  const scroller = document.getElementById(BREAKDOWN_SCROLL_ID)
  if (!section || !scroller) return

  const toolbarHeight = document.getElementById(BREAKDOWN_TOOLBAR_ID)?.offsetHeight ?? 0
  const top =
    section.getBoundingClientRect().top -
    scroller.getBoundingClientRect().top +
    scroller.scrollTop -
    toolbarHeight -
    16
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  scroller.scrollTo({ top, behavior: reduceMotion ? "auto" : "smooth" })
}
