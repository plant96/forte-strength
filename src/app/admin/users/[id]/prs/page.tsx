import { cn } from "cn"
import { ArrowLeftIcon, ListIcon, PlusIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { getUserDetail } from "@/features/admin/queries"
import { AddPanel } from "@/features/pr-tracker/components/add/add-panel"
import { SummaryStrip } from "@/features/pr-tracker/components/summary-strip"
import { ViewPanel } from "@/features/pr-tracker/components/view/view-panel"
import { getLiftUnit, getTrackerSummary, listExercises } from "@/features/pr-tracker/queries"
import { requireAdmin } from "@/server/auth"

import { displayName } from "@/features/admin/components/user-badges"

export const metadata: Metadata = { title: "Client PRs", robots: { index: false } }

type Props = PageProps<"/admin/users/[id]/prs">

/**
 * A client's PR tracker, exactly as they see it.
 *
 * The panels are the same components the tool itself renders — they take the athlete's id
 * as a prop rather than reading the session, which is what keeps "what the coach sees" and
 * "what the client sees" from drifting apart. The one addition is that a coach can log a
 * record on the client's behalf; those are stamped and badged.
 */
export default async function AdminClientPrsPage(props: Props) {
  await requireAdmin()
  const { id } = await props.params
  const { panel } = await props.searchParams

  const user = await getUserDetail(id)
  if (!user) notFound()

  const [exercises, unit, summary] = await Promise.all([
    listExercises(user.id),
    getLiftUnit(user.id),
    getTrackerSummary(user.id),
  ])

  const active = panel === "add" ? "add" : "view"
  const basePath = `/admin/users/${user.id}/prs`
  const name = displayName(user)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href={`/admin/users/${user.id}`}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Back to {name}
        </Link>
        <h1 className="mt-3 font-heading text-2xl font-bold tracking-tight uppercase sm:text-3xl">
          {name}&apos;s PRs
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          The same graphs {name.split(" ")[0]} sees. Weights are shown in the unit they log in (
          {unit}).
        </p>
      </div>

      <nav
        aria-label="PR tracker mode"
        className="grid w-fit grid-cols-2 gap-1.5 rounded-xl bg-card p-1.5 ring-1 ring-foreground/10"
      >
        {(
          [
            { key: "view", label: "View PRs", icon: ListIcon },
            { key: "add", label: "Log a PR", icon: PlusIcon },
          ] as const
        ).map((option) => (
          <Link
            key={option.key}
            href={`${basePath}?panel=${option.key}`}
            aria-current={active === option.key ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 font-heading text-sm font-semibold tracking-wider uppercase transition-colors",
              active === option.key
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <option.icon className="size-4" />
            {option.label}
          </Link>
        ))}
      </nav>

      {summary.recordCount > 0 && <SummaryStrip summary={summary} unit={unit} />}

      {active === "add" ? (
        <AddPanel exercises={exercises} unit={unit} basePath={basePath} athleteId={user.id} />
      ) : (
        <ViewPanel exercises={exercises} unit={unit} basePath={basePath} athleteId={user.id} />
      )}
    </div>
  )
}
