import { cn } from "cn"
import { ChevronRightIcon, InboxIcon, SearchXIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  AdminHeader,
  EmptyState,
  Pagination,
  StatusBadge,
} from "@/features/admin/components/admin-ui"
import { SearchInput } from "@/features/admin/components/search-input"
import { listApplications } from "@/features/admin/queries"
import {
  parseApplicationFilters,
  toQueryString,
  type ApplicationStatusFilter,
} from "@/features/admin/search-params"
import { primaryNeedLabel } from "@/features/applications/format"
import { optionShort, READINESS_OPTIONS } from "@/features/applications/options"
import { formatRelative } from "@/lib/dates"

export const metadata: Metadata = { title: "Applications" }

const TABS: { value: ApplicationStatusFilter; label: string }[] = [
  { value: "unprocessed", label: "Unprocessed" },
  { value: "processed", label: "Processed" },
  { value: "all", label: "All" },
]

export default async function AdminApplicationsPage(props: PageProps<"/admin/applications">) {
  const filters = parseApplicationFilters(await props.searchParams)
  const { items, pageCount, counts } = await listApplications(filters)

  const listQuery = (overrides: Partial<typeof filters>) => {
    const next = { ...filters, ...overrides }
    return toQueryString({
      q: next.q,
      status: next.status === "unprocessed" ? undefined : next.status,
      page: next.page,
    })
  }
  const detailHref = (id: string) =>
    `/admin/applications/${id}${toQueryString({ q: filters.q, status: filters.status })}`

  return (
    <>
      <AdminHeader
        title="Applications"
        description="Coaching applications from the website, newest first."
      />

      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <nav
          aria-label="Filter by status"
          className="flex gap-1 rounded-xl bg-card p-1 ring-1 ring-foreground/10"
        >
          {TABS.map((tab) => {
            const active = tab.value === filters.status
            const count = counts[tab.value]
            return (
              <Link
                key={tab.value}
                href={`/admin/applications${listQuery({ status: tab.value, page: 1 })}`}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {tab.label}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[0.7rem] leading-none tabular-nums",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {count}
                </span>
              </Link>
            )
          })}
        </nav>
        <div className="md:w-80">
          <SearchInput
            label="Search applications"
            placeholder="Search name, email, Instagram, phone…"
          />
        </div>
      </div>

      {items.length === 0 ? (
        filters.q ? (
          <EmptyState
            icon={SearchXIcon}
            title="No matches"
            description={`Nothing matches “${filters.q}”. Try a different name, email or handle.`}
          />
        ) : (
          <EmptyState
            icon={InboxIcon}
            title={filters.status === "unprocessed" ? "All caught up" : "No applications yet"}
            description={
              filters.status === "unprocessed"
                ? "Every application has been processed."
                : "New applications from /application will appear here."
            }
          />
        )
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">Applicant</TableHead>
                  <TableHead>Primary need</TableHead>
                  <TableHead>Ready?</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((application) => (
                  <TableRow key={application.id} className="group relative">
                    <TableCell className="pl-5">
                      <Link
                        href={detailHref(application.id)}
                        className="flex flex-col after:absolute after:inset-0 after:content-['']"
                      >
                        <span className="font-medium">{application.fullName}</span>
                        <span className="text-xs text-muted-foreground">
                          {application.email} · {application.location}
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-muted-foreground">
                      {primaryNeedLabel(application)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {optionShort(READINESS_OPTIONS, application.readiness)}
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatRelative(application.createdAt)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={application.status} />
                    </TableCell>
                    <TableCell className="pr-4">
                      <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile cards */}
          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((application) => (
              <li key={application.id}>
                <Link
                  href={detailHref(application.id)}
                  className="flex flex-col gap-2 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="font-medium">{application.fullName}</span>
                    <StatusBadge status={application.status} />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {primaryNeedLabel(application)}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {optionShort(READINESS_OPTIONS, application.readiness)} ·{" "}
                    {formatRelative(application.createdAt)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <Pagination
            page={filters.page}
            pageCount={pageCount}
            hrefFor={(page) => `/admin/applications${listQuery({ page })}`}
          />
        </>
      )}
    </>
  )
}
