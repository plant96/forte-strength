import { ToolShell } from "@/components/layout/tool-shell"
import { PrTrackerPanels, type Panel } from "@/features/pr-tracker/components/pr-tracker-panels"
import { SummaryStrip } from "@/features/pr-tracker/components/summary-strip"
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
  const initial: Panel =
    panel === "add" || panel === "view" ? panel : exercises.length ? "view" : "add"

  return (
    <ToolShell title="PR Tracker" description={description}>
      <PrTrackerPanels
        exercises={exercises}
        unit={unit}
        basePath="/tools/pr-tracker"
        initialPanel={initial}
        summary={summary.recordCount > 0 ? <SummaryStrip summary={summary} /> : null}
      />
    </ToolShell>
  )
}
