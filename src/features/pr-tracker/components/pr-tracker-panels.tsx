"use client"

import { cn } from "cn"
import { ListIcon, PlusIcon } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

import type { WeightUnit } from "@/lib/units"

import type { ExerciseListItem } from "../queries"
import { AddPanel } from "./add/add-panel"
import { ViewPanel } from "./view/view-panel"

/**
 * The Add / View switch, and whichever panel it is showing.
 *
 * Both panels are built from exactly the same data — the movement list and the lifter's
 * unit — so switching between them used to spend a full server round trip (Clerk, then
 * three Neon queries) re-fetching what the page already had, for a second or two of dead
 * air. The page fetches once and the switch is local state.
 *
 * The URL still carries the choice, so a link to a panel opens on that panel. It is written
 * with `history.replaceState` rather than a router navigation: it keeps the address bar
 * honest without re-rendering the route, and it deliberately does not stack a history entry
 * per toggle, so Back still leaves the tracker rather than walking through every flip.
 */

export type Panel = "add" | "view"

interface PrTrackerPanelsProps {
  exercises: ExerciseListItem[]
  unit: WeightUnit
  basePath: string
  initialPanel: Panel
  /** Set when a coach is working on a client's records. */
  athleteId?: string
  /**
   * Rendered at the top of the View panel's movement list only — not on Add, and not once
   * a movement is open. Server-rendered, so it stays off the client.
   */
  summary?: React.ReactNode
  /** The admin page sits inside its own chrome and wants a tighter switch. */
  compact?: boolean
}

export function PrTrackerPanels({
  exercises,
  unit,
  basePath,
  initialPanel,
  athleteId,
  summary,
  compact = false,
}: PrTrackerPanelsProps) {
  const [panel, setPanel] = useState<Panel>(initialPanel)
  // Bumped to remount the View panel, which is how "take me back" is expressed: its
  // drilled-in movement is local state, and a fresh mount is a cleared one.
  const [viewKey, setViewKey] = useState(0)

  function select(next: Panel) {
    if (next === panel) {
      // Already here. Pressing the tab you are on means "back to the top of it" — from a
      // movement's graphs to the list of movements — rather than nothing at all.
      if (next === "view") setViewKey((key) => key + 1)
      return
    }
    setPanel(next)
    window.history.replaceState(null, "", `${basePath}?panel=${next}`)
  }

  const options = [
    { key: "add", label: compact ? "Log a PR" : "Add PRs", icon: PlusIcon },
    { key: "view", label: "View PRs", icon: ListIcon },
  ] as const
  const ordered = compact ? [options[1], options[0]] : options

  return (
    <div className="flex flex-col gap-6">
      <nav
        aria-label="PR tracker mode"
        className={cn(
          "grid grid-cols-2 gap-1.5 rounded-2xl bg-card p-1.5 ring-1 ring-foreground/10",
          compact ? "w-fit rounded-xl" : "sm:mx-auto sm:w-fit",
        )}
      >
        {ordered.map((option) => {
          const active = panel === option.key
          return (
            <Link
              key={option.key}
              href={`${basePath}?panel=${option.key}`}
              aria-current={active ? "page" : undefined}
              // A real link, so middle-click and "open in new tab" still behave. Only a
              // plain left-click is intercepted, and that one never leaves the page.
              onClick={(event) => {
                if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
                event.preventDefault()
                select(option.key)
              }}
              className={cn(
                "flex items-center justify-center gap-2 font-heading text-sm font-semibold tracking-wider uppercase transition-colors",
                compact ? "rounded-lg px-5 py-2.5" : "rounded-xl px-6 py-3 sm:px-10",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
              )}
            >
              <option.icon className="size-4" />
              {option.label}
            </Link>
          )
        })}
      </nav>

      {panel === "add" ? (
        <AddPanel exercises={exercises} unit={unit} basePath={basePath} athleteId={athleteId} />
      ) : (
        <ViewPanel
          key={viewKey}
          exercises={exercises}
          unit={unit}
          basePath={basePath}
          athleteId={athleteId}
          summary={summary}
        />
      )}
    </div>
  )
}
