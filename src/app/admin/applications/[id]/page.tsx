import { cn } from "cn"
import {
  ArrowLeftIcon,
  AtSignIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  MailIcon,
  MessageSquareIcon,
  PhoneIcon,
  TrophyIcon,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { StatusBadge } from "@/features/admin/components/admin-ui"
import { ApplicationActions } from "@/features/admin/components/application-actions"
import { getApplicationWithNeighbors } from "@/features/admin/queries"
import { parseApplicationFilters, toQueryString } from "@/features/admin/search-params"
import { formatLifts, instagramUrl, primaryNeedLabel } from "@/features/applications/format"
import {
  CURRENT_COACH_OPTIONS,
  FINANCE_OPTIONS,
  optionLabel,
  QUESTIONS,
  READINESS_OPTIONS,
} from "@/features/applications/options"
import { formatDateTime, formatRelative } from "@/lib/dates"

export const metadata: Metadata = { title: "Application" }

export default async function AdminApplicationPage(props: PageProps<"/admin/applications/[id]">) {
  const [{ id }, searchParams] = await Promise.all([props.params, props.searchParams])
  const filters = parseApplicationFilters(searchParams)
  const result = await getApplicationWithNeighbors(id, filters)
  if (!result) notFound()

  const { application, newerId, olderId } = result
  const filterQuery = toQueryString({ q: filters.q, status: filters.status })
  const backHref = `/admin/applications${toQueryString({
    q: filters.q,
    status: filters.status === "unprocessed" ? undefined : filters.status,
  })}`
  const lifts = formatLifts(application)
  const phoneDigits = application.phone.replace(/[^\d+]/g, "")

  const facts = [
    { label: "Primary need", value: primaryNeedLabel(application) },
    { label: "Ready to start", value: optionLabel(READINESS_OPTIONS, application.readiness) },
    { label: "Finances", value: optionLabel(FINANCE_OPTIONS, application.financePriority) },
    { label: "Current coach", value: optionLabel(CURRENT_COACH_OPTIONS, application.currentCoach) },
    { label: "Age", value: String(application.age) },
    { label: "Location", value: application.location },
    { label: "Weight class", value: application.weightClass },
    { label: "Commitment", value: `“${application.commitment}”` },
  ]

  const answers = [
    {
      label: QUESTIONS.goals.label,
      hint: "Goals for the next 3–6 months",
      value: application.goals,
    },
    { label: QUESTIONS.challenges.label, value: application.challenges },
    { label: QUESTIONS.injuries.label, value: application.injuries },
    { label: QUESTIONS.nutritionRestrictions.label, value: application.nutritionRestrictions },
    { label: QUESTIONS.programming.label, value: application.programming },
    { label: QUESTIONS.whyForte.label, value: application.whyForte },
  ]

  return (
    <article className="flex flex-col gap-6">
      {/* Navigation */}
      <div className="flex items-center justify-between gap-3">
        <Link
          href={backHref}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeftIcon className="size-4" />
          Applications
        </Link>
        <div className="flex gap-1">
          <NeighborLink
            href={newerId ? `/admin/applications/${newerId}${filterQuery}` : null}
            label="Newer"
            icon="prev"
          />
          <NeighborLink
            href={olderId ? `/admin/applications/${olderId}${filterQuery}` : null}
            label="Older"
            icon="next"
          />
        </div>
      </div>

      {/* Header */}
      <header className="flex flex-col gap-5 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl leading-none font-bold uppercase sm:text-4xl">
                {application.fullName}
              </h1>
              <StatusBadge status={application.status} />
            </div>
            <p className="text-sm text-muted-foreground">
              Submitted {formatDateTime(application.createdAt)} (
              {formatRelative(application.createdAt)})
              {application.processedAt && ` · Processed ${formatRelative(application.processedAt)}`}
            </p>
          </div>
          <ApplicationActions
            id={application.id}
            name={application.fullName}
            processed={application.status === "PROCESSED"}
            backHref={backHref}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <ContactLink href={`mailto:${application.email}`} icon={MailIcon}>
            {application.email}
          </ContactLink>
          <ContactLink href={`tel:${phoneDigits}`} icon={PhoneIcon}>
            {application.phone}
          </ContactLink>
          <ContactLink href={`sms:${phoneDigits}`} icon={MessageSquareIcon}>
            Text
          </ContactLink>
          <ContactLink href={instagramUrl(application.instagram)} icon={AtSignIcon} external>
            {application.instagram}
          </ContactLink>
        </div>
      </header>

      {/* Key facts + lifts */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <section
          aria-label="Key facts"
          className="grid gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-foreground/10 sm:grid-cols-2"
        >
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-1 bg-card p-4">
              <span className="text-xs text-muted-foreground">{fact.label}</span>
              <span className="text-sm font-medium">{fact.value}</span>
            </div>
          ))}
        </section>

        <div className="flex flex-col gap-4">
          <section
            aria-labelledby="lifts-heading"
            className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-primary/30"
          >
            <div className="flex items-center justify-between gap-3">
              <h2 id="lifts-heading" className="font-heading text-lg font-bold uppercase">
                Best lifts
              </h2>
              {lifts.competition && (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-highlight">
                  <TrophyIcon className="size-3" />
                  Competition
                </span>
              )}
            </div>
            <dl className="grid grid-cols-3 gap-3">
              {[
                { label: "Squat", value: application.squat },
                { label: "Bench", value: application.bench },
                { label: "Deadlift", value: application.deadlift },
              ].map((lift) => (
                <div key={lift.label} className="flex flex-col gap-1">
                  <dt className="text-xs text-muted-foreground">{lift.label}</dt>
                  <dd className="font-heading text-2xl leading-none font-bold">
                    {lift.value.toLocaleString("en-US", { maximumFractionDigits: 1 })}
                    <span className="ml-0.5 text-xs font-normal text-muted-foreground">
                      {lifts.unit}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
            <p className="flex items-baseline justify-between border-t border-border pt-3 text-sm text-muted-foreground">
              Total
              <span className="font-heading text-3xl leading-none font-bold text-foreground">
                {lifts.total}
              </span>
            </p>
          </section>

          <section
            aria-labelledby="overthinker-heading"
            className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-foreground/10"
          >
            <div className="flex items-center justify-between">
              <h2 id="overthinker-heading" className="text-xs text-muted-foreground">
                Overthinker (self-rated)
              </h2>
              <span className="font-heading text-2xl leading-none font-bold">
                {application.overthinker}
                <span className="text-sm font-normal text-muted-foreground">/10</span>
              </span>
            </div>
            <div
              role="meter"
              aria-valuemin={1}
              aria-valuemax={10}
              aria-valuenow={application.overthinker}
              aria-label="Overthinker score"
              className="flex gap-1"
            >
              {Array.from({ length: 10 }, (_, index) => (
                <span
                  key={index}
                  className={cn(
                    "h-2 flex-1 rounded-sm",
                    index < application.overthinker ? "bg-primary" : "bg-muted",
                  )}
                />
              ))}
            </div>
          </section>
        </div>
      </div>

      {/* Long answers */}
      <section aria-label="Answers" className="flex flex-col gap-4">
        {answers.map((answer) => (
          <div
            key={answer.label}
            className="rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:p-6"
          >
            <h2 className="text-sm font-semibold text-muted-foreground">{answer.label}</h2>
            <p className="mt-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap">
              {answer.value}
            </p>
          </div>
        ))}
      </section>
    </article>
  )
}

function ContactLink({
  href,
  icon: Icon,
  external,
  children,
}: {
  href: string
  icon: typeof MailIcon
  external?: boolean
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      {...(external && { target: "_blank", rel: "noopener noreferrer" })}
      className="inline-flex max-w-full min-w-0 items-center gap-2 rounded-lg bg-muted/50 px-3 py-2 text-sm ring-1 ring-foreground/10 transition-colors hover:bg-muted hover:ring-primary/40"
    >
      <Icon className="size-4 shrink-0 text-highlight" />
      <span className="truncate">{children}</span>
    </a>
  )
}

function NeighborLink({
  href,
  label,
  icon,
}: {
  href: string | null
  label: string
  icon: "prev" | "next"
}) {
  const content = (
    <>
      {icon === "prev" && <ChevronLeftIcon className="size-4" />}
      {label}
      {icon === "next" && <ChevronRightIcon className="size-4" />}
    </>
  )
  const className =
    "inline-flex h-9 items-center gap-1 rounded-lg px-3 text-sm ring-1 ring-foreground/10"
  return href ? (
    <Link href={href} className={cn(className, "hover:bg-muted/60")}>
      {content}
    </Link>
  ) : (
    <span className={cn(className, "text-muted-foreground/50")} aria-disabled="true">
      {content}
    </span>
  )
}
