"use client"

import { cn } from "cn"
import { useLayoutEffect, useRef, useState } from "react"

/**
 * A title with a headline stat beside it — or below it, when there is no room.
 *
 * Side by side, the stat reads best pinned to the right edge; stacked, it reads best
 * pinned to the left under the title. CSS cannot tell whether a wrapping flex line has
 * actually wrapped, so the row measures itself and says so with `data-stacked`, and the
 * children pick their alignment off it with `group-data-[stacked=true]:` variants.
 */
export function StatRow({
  as: Tag = "div",
  className,
  children,
}: {
  as?: "div" | "header"
  className?: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [stacked, setStacked] = useState(false)

  useLayoutEffect(() => {
    const row = ref.current
    if (!row) return

    function measure() {
      const [first, second] = row!.children
      if (!first || !second) {
        setStacked(false)
        return
      }
      // On one line the stat starts to the right of the title; wrapped, it starts back at
      // the row's left edge, under it.
      setStacked(second.getBoundingClientRect().left < first.getBoundingClientRect().right)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    return () => observer.disconnect()
  }, [])

  return (
    <Tag ref={ref} data-stacked={stacked} className={cn("group flex flex-wrap", className)}>
      {children}
    </Tag>
  )
}
