import { cn } from "cn"
import { ArchiveIcon, BugIcon, CalendarIcon, MonitorIcon, UserRoundIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AdminHeader, EmptyState, Pagination } from "@/features/admin/components/admin-ui"
import { BugReportActions } from "@/features/admin/components/bug-report-actions"
import { displayName } from "@/features/admin/components/user-badges"
import { listBugReports, type BugReportListItem } from "@/features/admin/queries"
import {
  parseBugReportFilters,
  toQueryString,
  type BugReportStatusFilter,
} from "@/features/admin/search-params"
import { parseBrowser, parseOs } from "@/features/analytics/lib/user-agent"
import { formatDateTime, formatRelative } from "@/lib/dates"

export const metadata: Metadata = { title: "Bug reports" }

const TABS: { value: BugReportStatusFilter; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "archived", label: "Archive" },
]

export default async function AdminBugReportsPage(props: PageProps<"/admin/bug-reports">) {
  const filters = parseBugReportFilters(await props.searchParams)
  const { items, pageCount, counts } = await listBugReports(filters)

  const listHref = (overrides: Partial<typeof filters>) => {
    const next = { ...filters, ...overrides }
    return `/admin/bug-reports${toQueryString({
      status: next.status === "open" ? undefined : next.status,
      page: next.page,
    })}`
  }

  return (
    <>
      <AdminHeader
        title="Bug reports"
        description="Filed from the footer's “Report a bug”. Archive one once it's dealt with; delete it from the archive."
      />

      <nav
        aria-label="Filter by status"
        className="mb-4 flex w-fit gap-1 rounded-xl bg-card p-1 ring-1 ring-foreground/10"
      >
        {TABS.map((tab) => {
          const active = tab.value === filters.status
          const count = counts[tab.value]
          return (
            <Link
              key={tab.value}
              href={listHref({ status: tab.value, page: 1 })}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.value === "archived" && <ArchiveIcon className="size-3.5" />}
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[0.7rem] leading-none tabular-nums",
                  active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}
              >
                {count}
              </span>
            </Link>
          )
        })}
      </nav>

      {items.length === 0 ? (
        filters.status === "open" ? (
          <EmptyState
            icon={BugIcon}
            title="No open bug reports"
            description="Anything filed from the footer's “Report a bug” will show up here."
          />
        ) : (
          <EmptyState
            icon={ArchiveIcon}
            title="The archive is empty"
            description="Archived reports land here, where they can be restored or deleted for good."
          />
        )
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {items.map((report) => (
              <li key={report.id}>
                <BugReportCard report={report} />
              </li>
            ))}
          </ul>
          <Pagination
            page={filters.page}
            pageCount={pageCount}
            hrefFor={(page) => listHref({ page })}
          />
        </>
      )}
    </>
  )
}

function BugReportCard({ report }: { report: BugReportListItem }) {
  const browser = report.userAgent ? parseBrowser(report.userAgent) : null
  const os = report.userAgent ? parseOs(report.userAgent) : null
  const client = [browser, os].filter(Boolean).join(" on ")

  return (
    <article className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <UserRoundIcon className="size-4 text-highlight" />
          {report.reporter ? (
            <Link
              href={`/admin/users/${report.reporter.id}`}
              className="text-foreground hover:underline"
            >
              {displayName(report.reporter)}
            </Link>
          ) : report.email ? (
            <a href={`mailto:${report.email}`} className="text-foreground hover:underline">
              {report.email}
            </a>
          ) : (
            "Anonymous"
          )}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <CalendarIcon className="size-4 text-highlight" />
          <time dateTime={report.createdAt.toISOString()} title={formatDateTime(report.createdAt)}>
            {formatRelative(report.createdAt)}
          </time>
        </span>
        {client && (
          <span className="inline-flex items-center gap-1.5">
            <MonitorIcon className="size-4 text-highlight" />
            {client}
          </span>
        )}
        <span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-xs">{report.path}</span>
        {report.archivedAt && (
          <span className="text-xs">Archived {formatRelative(report.archivedAt)}</span>
        )}
      </div>

      <p className="text-sm leading-relaxed whitespace-pre-wrap">{report.description}</p>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        {report.userAgent ? (
          <details className="min-w-0 text-xs text-muted-foreground">
            <summary className="cursor-pointer select-none hover:text-foreground">
              User agent
            </summary>
            <p className="mt-1 font-mono wrap-anywhere">{report.userAgent}</p>
          </details>
        ) : (
          <span />
        )}
        <BugReportActions id={report.id} status={report.status} />
      </div>
    </article>
  )
}
