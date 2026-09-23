import { MailIcon, TriangleAlertIcon } from "lucide-react"
import type { Metadata } from "next"

import { AdminHeader } from "@/features/admin/components/admin-ui"
import {
  NOTIFICATION_GROUPS,
  ONLINE_MILESTONES,
  USER_MILESTONES,
  VISITOR_MILESTONES,
  type NotificationGroup,
} from "@/features/notifications/catalog"
import { NotificationToggle } from "@/features/notifications/components/notification-toggle"
import { notifyRecipient } from "@/features/notifications/notify"
import { getNotificationPreferences, getReachedMilestones } from "@/features/notifications/queries"
import type { MilestoneKind } from "@/generated/prisma/client"
import { formatDate } from "@/lib/dates"

export const metadata: Metadata = { title: "Notifications" }

const GROUP_BLURBS: Record<NotificationGroup, string> = {
  Inbox: "Things that land in your lap and need a reply.",
  People: "What the people on the site are up to.",
  Milestones: "One email per line crossed, ever — never a repeat.",
  Digests: "A regular round-up instead of a stream of pings.",
}

const MILESTONE_LABELS: Record<MilestoneKind, string> = {
  VISITORS: "unique visitors",
  USERS: "website users",
  ONLINE: "online at once",
}

const MILESTONE_KEYS: Record<MilestoneKind, string> = {
  VISITORS: "visitor-milestones",
  USERS: "user-milestones",
  ONLINE: "online-milestones",
}

const THRESHOLDS: Record<MilestoneKind, readonly number[]> = {
  VISITORS: VISITOR_MILESTONES,
  USERS: USER_MILESTONES,
  ONLINE: ONLINE_MILESTONES,
}

export default async function AdminNotificationsPage() {
  const [preferences, milestones] = await Promise.all([
    getNotificationPreferences(),
    getReachedMilestones(),
  ])
  const recipient = notifyRecipient()
  const emailConfigured = Boolean(process.env.RESEND_API_KEY)

  return (
    <>
      <AdminHeader
        title="Notifications"
        description="Which emails you get, and when. Everything here is optional except the ones you switch on."
      />

      <div className="mb-6 flex flex-col gap-2">
        <p className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <MailIcon className="size-4 text-highlight" />
          Emails go to <span className="font-medium text-foreground">{recipient}</span>.
        </p>
        {!emailConfigured && (
          <p className="inline-flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-sm text-muted-foreground ring-1 ring-foreground/10">
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-highlight" />
            Email sending is off in this environment (no RESEND_API_KEY). Toggles are saved anyway
            and emails are logged instead of sent.
          </p>
        )}
      </div>

      <div className="flex flex-col gap-6">
        {NOTIFICATION_GROUPS.map((group) => {
          const items = preferences.filter((preference) => preference.group === group)
          if (items.length === 0) return null
          return (
            <section
              key={group}
              aria-labelledby={`group-${group}`}
              className="overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"
            >
              <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
                <h2 id={`group-${group}`} className="font-heading text-xl font-bold uppercase">
                  {group}
                </h2>
                <p className="text-sm text-muted-foreground">{GROUP_BLURBS[group]}</p>
              </div>
              <ul className="divide-y divide-border">
                {items.map((item) => (
                  <li key={item.key} className="flex items-start gap-4 px-5 py-4">
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span className="font-medium">{item.title}</span>
                      <span className="text-sm text-muted-foreground">{item.description}</span>
                      {group === "Milestones" && (
                        <ReachedList
                          kind={
                            (Object.keys(MILESTONE_KEYS) as MilestoneKind[]).find(
                              (kind) => MILESTONE_KEYS[kind] === item.key,
                            ) ?? null
                          }
                          milestones={milestones}
                        />
                      )}
                    </div>
                    <NotificationToggle
                      keyName={item.key}
                      label={item.title}
                      enabled={item.enabled}
                    />
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </>
  )
}

function ReachedList({
  kind,
  milestones,
}: {
  kind: MilestoneKind | null
  milestones: Awaited<ReturnType<typeof getReachedMilestones>>
}) {
  if (!kind) return null
  const reached = new Map(
    milestones.filter((m) => m.kind === kind).map((m) => [m.threshold, m.reachedAt]),
  )
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {THRESHOLDS[kind].map((threshold) => {
        const at = reached.get(threshold)
        return (
          <li
            key={threshold}
            title={at ? `Reached ${formatDate(at)}` : "Not reached yet"}
            className={
              at
                ? "rounded-full bg-primary/15 px-2 py-0.5 text-xs font-medium text-highlight tabular-nums ring-1 ring-primary/30"
                : "rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground tabular-nums"
            }
          >
            {threshold.toLocaleString("en-US")}
            {at && <span className="sr-only"> {MILESTONE_LABELS[kind]}, reached</span>}
          </li>
        )
      })}
    </ul>
  )
}
