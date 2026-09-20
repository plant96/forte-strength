import { cn } from "cn"
import { ListIcon, PlusIcon } from "lucide-react"
import Link from "next/link"

import { ToolShell } from "@/components/layout/tool-shell"
import { AddPanel } from "@/features/pr-tracker/components/add/add-panel"
import { SummaryStrip } from "@/features/pr-tracker/components/summary-strip"
import { ViewPanel } from "@/features/pr-tracker/components/view/view-panel"
import { getLiftUnit, getTrackerSummary, listExercises } from "@/features/pr-tracker/queries"
import { getClientAreaUser } from "@/server/auth"

const description =
  "Log every personal record and watch the line climb. A graph for each lift and rep scheme, kept for as long as you train."

/**
 * The layout renders the upsell, but this page has to bail out for itself too: Next
 * renders page segments independently of whether the parent layout includes `children`,
 * so a layout-only check still ships the real content in the RSC payload. Returning null
 * means there is nothing to ship, and the layout's gate is what the visitor sees.
 */
export default async function PrTrackerPage(props: PageProps<"/tools/pr-tracker">) {
  const user = await getClientAreaUser()
  if (!user) return null

  const { panel } = await props.searchParams

  const [exercises, unit, summary] = await Promise.all([
    listExercises(user.id),
    getLiftUnit(user.id),
    getTrackerSummary(user.id),
  ])

  // Someone with records almost always came back to look at them; someone with none can
  // only usefully add. Defaulting beats opening on a screen that just asks them to choose.
  const active = panel === "add" || panel === "view" ? panel : exercises.length ? "view" : "add"

  return (
    <ToolShell title="PR Tracker" description={description}>
      <div className="flex flex-col gap-6">
        <PanelSwitch active={active} />
        {summary.recordCount > 0 && <SummaryStrip summary={summary} unit={unit} />}

        {active === "add" ? (
          <AddPanel exercises={exercises} unit={unit} basePath="/tools/pr-tracker" />
        ) : (
          <ViewPanel exercises={exercises} unit={unit} basePath="/tools/pr-tracker" />
        )}
      </div>
    </ToolShell>
  )
}

/**
 * The first choice on the page. A pair of links rather than client-side tabs, so the
 * choice lives in the URL — shareable, survives a refresh, and works with the back button.
 */
function PanelSwitch({ active }: { active: "add" | "view" }) {
  const options = [
    { key: "add", label: "Add PRs", icon: PlusIcon },
    { key: "view", label: "View PRs", icon: ListIcon },
  ] as const

  return (
    <nav
      aria-label="PR tracker mode"
      className="grid grid-cols-2 gap-1.5 rounded-2xl bg-card p-1.5 ring-1 ring-foreground/10 sm:mx-auto sm:w-fit"
    >
      {options.map((option) => {
        const isActive = active === option.key
        return (
          <Link
            key={option.key}
            href={`/tools/pr-tracker?panel=${option.key}`}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-6 py-3 font-heading text-sm font-semibold tracking-wider uppercase transition-colors sm:px-10",
              isActive
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
  )
}
