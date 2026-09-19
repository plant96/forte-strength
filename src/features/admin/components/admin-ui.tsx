import { cn } from "cn"
import { CheckIcon, ChevronLeftIcon, ChevronRightIcon, type LucideIcon } from "lucide-react"
import Link from "next/link"

/** Page title block used across the admin panel. */
export function AdminHeader({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <h1 className="font-heading text-3xl leading-none font-bold uppercase sm:text-4xl">
          {title}
        </h1>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
      </div>
      {children}
    </div>
  )
}

export function StatTile({
  label,
  value,
  icon: Icon,
  hint,
  href,
  accent,
}: {
  label: string
  value: number | string
  icon: LucideIcon
  hint?: string
  href?: string
  accent?: boolean
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn("size-4", accent ? "text-highlight" : "text-muted-foreground")} />
      </div>
      <span className="font-heading text-4xl leading-none font-bold">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </>
  )
  const className = cn(
    "flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 transition-colors",
    accent ? "ring-primary/35" : "ring-foreground/10",
    href && "hover:ring-primary/50",
  )
  return href ? (
    <Link href={href} className={className}>
      {body}
    </Link>
  ) : (
    <div className={className}>{body}</div>
  )
}

export function StatusBadge({ status }: { status: "UNPROCESSED" | "PROCESSED" }) {
  return status === "UNPROCESSED" ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-highlight ring-1 ring-primary/30">
      <span className="size-1.5 rounded-full bg-primary" aria-hidden="true" />
      Unprocessed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted-foreground">
      <CheckIcon className="size-3" aria-hidden="true" />
      Processed
    </span>
  )
}

export function Pagination({
  page,
  pageCount,
  hrefFor,
}: {
  page: number
  pageCount: number
  hrefFor: (page: number) => string
}) {
  if (pageCount <= 1) return null
  const linkClass =
    "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm ring-1 ring-foreground/10 hover:bg-muted/60"
  return (
    <nav aria-label="Pagination" className="mt-4 flex items-center justify-between gap-3">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} className={linkClass}>
          <ChevronLeftIcon className="size-4" />
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-sm text-muted-foreground tabular-nums">
        Page {page} of {pageCount}
      </span>
      {page < pageCount ? (
        <Link href={hrefFor(page + 1)} className={linkClass}>
          Next
          <ChevronRightIcon className="size-4" />
        </Link>
      ) : (
        <span />
      )}
    </nav>
  )
}

export function EmptyState({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border px-6 py-14 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-highlight">
        <Icon className="size-6" />
      </span>
      <p className="font-heading text-lg font-semibold uppercase">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
