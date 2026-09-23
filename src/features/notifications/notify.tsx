import "server-only"

import { NotificationEmail, type EmailFact } from "@/emails/notification-email"
import { LIVE_WINDOW_MINUTES } from "@/features/analytics/lib/config"
import { seriesLabel, type SeriesShape } from "@/features/pr-tracker/lib/series"
import { formatWeight } from "@/features/pr-tracker/lib/weight"
import { WEIGHT_UNIT_FROM_DB } from "@/features/profile/mappers"
import { Prisma, type MilestoneKind } from "@/generated/prisma/client"
import { formatDateTime } from "@/lib/dates"
import { sendEmail, siteUrl } from "@/lib/email"
import { db } from "@/server/db"

import {
  newlyCrossed,
  ONLINE_MILESTONES,
  USER_MILESTONES,
  VISITOR_MILESTONES,
  type NotificationKey,
} from "./catalog"
import { isNotificationEnabled } from "./queries"

/**
 * Coach email notifications.
 *
 * Every sender here checks its toggle, builds one `NotificationEmail`, and never throws:
 * these run inside `after()` or a cron, where a failure has nobody to report to but the log.
 */

export const DEFAULT_NOTIFY_EMAIL = "Tym.26911@gmail.com"

/** Where coach notifications go. One address for everything, set by env or the default. */
export function notifyRecipient() {
  return process.env.APPLICATION_NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL
}

interface Message {
  subject: string
  react: React.ReactNode
  replyTo?: string
}

/** Sends one coach email if that notification is switched on. Returns whether it was sent. */
export async function sendNotification(
  key: NotificationKey,
  message: Message | (() => Message | Promise<Message>),
) {
  try {
    if (!(await isNotificationEnabled(key))) return false
    const resolved = typeof message === "function" ? await message() : message
    await sendEmail({ to: notifyRecipient(), ...resolved })
    return true
  } catch (error) {
    console.error(`[notifications] Could not send "${key}":`, error)
    return false
  }
}

const adminUrl = (path: string) => `${siteUrl()}/admin${path}`

function personName(user: { firstName: string | null; lastName: string | null; email: string }) {
  return [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email
}

// ---------------------------------------------------------------------------
// Inbox
// ---------------------------------------------------------------------------

export async function notifyBugReport(report: {
  id: string
  description: string
  path: string
  email: string | null
  userId: string | null
  userAgent: string | null
  createdAt: Date
}) {
  return sendNotification("bug-report-received", {
    subject: `Bug report: ${report.path}`,
    replyTo: report.email ?? undefined,
    react: (
      <NotificationEmail
        preview={`Bug report on ${report.path}`}
        eyebrow="Bug report"
        title={`Something broke on ${report.path}`}
        intro={report.description}
        facts={[
          { label: "Page", value: report.path },
          {
            label: "Reporter",
            value: report.email ?? (report.userId ? "Signed-in user" : "Anonymous"),
          },
          { label: "Reported", value: `${formatDateTime(report.createdAt)}` },
          { label: "Browser", value: report.userAgent?.slice(0, 120) ?? "Unknown" },
        ]}
        cta={{ label: "Open bug reports", href: adminUrl("/bug-reports") }}
      />
    ),
  })
}

// ---------------------------------------------------------------------------
// People
// ---------------------------------------------------------------------------

type UserSummary = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  createdAt: Date
}

export async function notifyUserSignedUp(user: UserSummary) {
  return sendNotification("user-signed-up", {
    subject: `New sign-up: ${personName(user)}`,
    react: (
      <NotificationEmail
        preview={`${personName(user)} just created an account`}
        eyebrow="New user"
        title={personName(user)}
        intro="A new website account was just created."
        facts={[
          { label: "Email", value: user.email },
          { label: "Signed up", value: formatDateTime(user.createdAt) },
        ]}
        cta={{ label: "View user", href: adminUrl(`/users/${user.id}`) }}
      />
    ),
  })
}

export async function notifyProfileCompleted(user: UserSummary) {
  return sendNotification("profile-completed", {
    subject: `Profile completed: ${personName(user)}`,
    react: (
      <NotificationEmail
        preview={`${personName(user)} finished profile setup`}
        eyebrow="Profile completed"
        title={personName(user)}
        intro="They finished the profile setup wizard, so their stats are on file."
        facts={[{ label: "Email", value: user.email }]}
        cta={{ label: "View profile", href: adminUrl(`/users/${user.id}`) }}
      />
    ),
  })
}

export async function notifyClientPr(input: {
  athleteId: string
  exerciseName: string
  shape: SeriesShape
  weightKg: number
  previousKg: number | null
}) {
  return sendNotification("client-pr-logged", async () => {
    const user = await db.user.findUnique({
      where: { id: input.athleteId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        liftUnit: true,
        clientSince: true,
      },
    })
    if (!user) throw new Error("Athlete not found")
    // Admins can log their own PRs too; the coach doesn't need an email about those.
    if (!user.clientSince) throw new Error("Not a coaching client")
    const unit = WEIGHT_UNIT_FROM_DB[user.liftUnit]
    const weight = formatWeight(input.weightKg, unit)
    const label = `${input.exerciseName} ${seriesLabel(input.shape)}`
    const facts: EmailFact[] = [
      { label: "Lift", value: label },
      { label: "New record", value: weight },
    ]
    if (input.previousKg !== null) {
      facts.push({ label: "Previous", value: formatWeight(input.previousKg, unit) })
    }
    return {
      subject: `PR: ${personName(user)} hit ${weight} on ${label}`,
      react: (
        <NotificationEmail
          preview={`${personName(user)} just logged ${weight}`}
          eyebrow="New PR"
          title={`${personName(user)} · ${weight}`}
          intro={`${personName(user)} just logged a new ${label}.`}
          facts={facts}
          cta={{ label: "See their PRs", href: adminUrl(`/users/${user.id}/prs`) }}
        />
      ),
    }
  })
}

// ---------------------------------------------------------------------------
// Milestones
// ---------------------------------------------------------------------------

/**
 * Records every threshold `count` has passed and emails the highest new one. The
 * primary key on (kind, threshold) is the guarantee: two requests crossing the same
 * line at once both try to insert, and only the one that inserts anything sends.
 */
async function reachMilestones(
  kind: MilestoneKind,
  key: NotificationKey,
  thresholds: readonly number[],
  count: number,
  describe: (threshold: number) => Message,
) {
  if (!(await isNotificationEnabled(key))) return
  const reachedRows = await db.notificationMilestone.findMany({
    where: { kind },
    select: { threshold: true },
  })
  const reached = new Set(reachedRows.map((row) => row.threshold))
  const crossed = newlyCrossed(thresholds, count, reached)
  if (crossed.length === 0) return

  const inserted = await db.notificationMilestone.createMany({
    data: crossed.map((threshold) => ({ kind, threshold })),
    skipDuplicates: true,
  })
  if (inserted.count === 0) return

  const top = crossed[crossed.length - 1]
  await sendEmail({ to: notifyRecipient(), ...describe(top) })
}

const milestoneEmail = (noun: string, threshold: number, cta: { label: string; href: string }) => ({
  subject: `Milestone: ${threshold.toLocaleString("en-US")} ${noun}`,
  react: (
    <NotificationEmail
      preview={`The site just passed ${threshold.toLocaleString("en-US")} ${noun}`}
      eyebrow="Milestone"
      title={`${threshold.toLocaleString("en-US")} ${noun}`}
      intro={`Forte Strength just passed ${threshold.toLocaleString("en-US")} ${noun}.`}
      cta={cta}
    />
  ),
})

export async function checkVisitorMilestones() {
  try {
    const count = await db.visitor.count()
    await reachMilestones("VISITORS", "visitor-milestones", VISITOR_MILESTONES, count, (n) =>
      milestoneEmail("unique visitors", n, {
        label: "Open analytics",
        href: adminUrl("/analytics"),
      }),
    )
  } catch (error) {
    console.error("[notifications] Visitor milestone check failed:", error)
  }
}

export async function checkUserMilestones() {
  try {
    const count = await db.user.count()
    await reachMilestones("USERS", "user-milestones", USER_MILESTONES, count, (n) =>
      milestoneEmail("website users", n, { label: "View users", href: adminUrl("/users") }),
    )
  } catch (error) {
    console.error("[notifications] User milestone check failed:", error)
  }
}

let nextOnlineCheckAt = 0
const ONLINE_CHECK_INTERVAL_MS = 30_000

/** Distinct live visitors, counted the same way as the analytics "live" tile. Throttled. */
export async function checkOnlineMilestones() {
  if (Date.now() < nextOnlineCheckAt) return
  nextOnlineCheckAt = Date.now() + ONLINE_CHECK_INTERVAL_MS
  try {
    if (!(await isNotificationEnabled("online-milestones"))) return
    const since = new Date(Date.now() - LIVE_WINDOW_MINUTES * 60 * 1000)
    const rows = await db.$queryRaw<{ visitors: number }[]>(Prisma.sql`
      SELECT COUNT(DISTINCT "visitorId")::int AS visitors
      FROM "PageView" WHERE "createdAt" >= ${since} AND "isBot" = false
    `)
    const count = rows[0]?.visitors ?? 0
    await reachMilestones("ONLINE", "online-milestones", ONLINE_MILESTONES, count, (n) =>
      milestoneEmail("visitors online at once", n, {
        label: "Open analytics",
        href: adminUrl("/analytics"),
      }),
    )
  } catch (error) {
    console.error("[notifications] Online milestone check failed:", error)
  }
}

// ---------------------------------------------------------------------------
// Hooks called from elsewhere
// ---------------------------------------------------------------------------

/** First sight of a new account (from `getCurrentUser`). */
export async function onUserCreated(user: UserSummary) {
  await notifyUserSignedUp(user)
  await checkUserMilestones()
}

/** A visitor cookie we have never seen (from the analytics collector). */
export async function onNewVisitor(visitorId: string) {
  try {
    await db.visitor.createMany({ data: [{ id: visitorId }], skipDuplicates: true })
  } catch (error) {
    console.error("[notifications] Could not record the visitor:", error)
    return
  }
  await checkVisitorMilestones()
}

// ---------------------------------------------------------------------------
// Digests
// ---------------------------------------------------------------------------

const WEEK_MS = 7 * 24 * 60 * 60 * 1000

/** The Monday email. Returns whether it was sent (false when off or on failure). */
export async function sendWeeklySummary(now = new Date()) {
  const from = new Date(now.getTime() - WEEK_MS)
  return sendNotification("weekly-summary", async () => {
    const [traffic, users, applications, prs, bugs, clients] = await Promise.all([
      db.$queryRaw<{ visitors: number; views: number }[]>(Prisma.sql`
        SELECT COUNT(DISTINCT "visitorId")::int AS visitors, COUNT(*)::int AS views
        FROM "PageView" WHERE "createdAt" >= ${from} AND "createdAt" < ${now} AND "isBot" = false
      `),
      db.user.count({ where: { createdAt: { gte: from, lt: now } } }),
      db.application.count({ where: { createdAt: { gte: from, lt: now } } }),
      db.prEntry.count({ where: { createdAt: { gte: from, lt: now } } }),
      db.bugReport.count({ where: { createdAt: { gte: from, lt: now } } }),
      db.user.count({ where: { clientSince: { not: null } } }),
    ])
    const stats = traffic[0] ?? { visitors: 0, views: 0 }
    const n = (value: number) => value.toLocaleString("en-US")
    return {
      subject: `Weekly summary: ${n(stats.visitors)} visitors, ${n(users)} sign-ups, ${n(applications)} applications`,
      react: (
        <NotificationEmail
          preview="Your week at Forte Strength"
          eyebrow="Weekly summary"
          title="Your week"
          intro={`${formatDateTime(from)} to ${formatDateTime(now)}.`}
          facts={[
            { label: "Unique visitors", value: n(stats.visitors) },
            { label: "Page views", value: n(stats.views) },
            { label: "New sign-ups", value: n(users) },
            { label: "Applications", value: n(applications) },
            { label: "PRs logged", value: n(prs) },
            { label: "Bug reports", value: n(bugs) },
            { label: "Active clients", value: n(clients) },
          ]}
          cta={{ label: "Open the admin panel", href: adminUrl("") }}
        />
      ),
    }
  })
}
