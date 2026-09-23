/**
 * Every email the coach can opt into, with its default. Toggles live in the database
 * (`NotificationPreference`), keyed by `key`; a missing row means `defaultEnabled`.
 *
 * Adding a notification is adding an entry here and a sender in `notify.tsx` — no
 * migration, because the table stores keys, not columns.
 */

export type NotificationKey =
  | "application-received"
  | "bug-report-received"
  | "user-signed-up"
  | "profile-completed"
  | "client-pr-logged"
  | "visitor-milestones"
  | "user-milestones"
  | "online-milestones"
  | "weekly-summary"

export type NotificationGroup = "Inbox" | "People" | "Milestones" | "Digests"

export interface NotificationDefinition {
  key: NotificationKey
  group: NotificationGroup
  title: string
  description: string
  defaultEnabled: boolean
}

export const VISITOR_MILESTONES = [100, 500, 1_000, 10_000, 100_000] as const
export const USER_MILESTONES = [10, 20, 50, 100, 500, 1_000, 10_000, 100_000] as const
export const ONLINE_MILESTONES = [5, 10, 20, 50, 100] as const

function joinList(values: readonly number[]) {
  const parts = values.map((n) => n.toLocaleString("en-US"))
  return `${parts.slice(0, -1).join(", ")} and ${parts.at(-1)}`
}

export const NOTIFICATIONS: readonly NotificationDefinition[] = [
  {
    key: "application-received",
    group: "Inbox",
    title: "Application received",
    description: "Someone submits the coaching application.",
    defaultEnabled: true,
  },
  {
    key: "bug-report-received",
    group: "Inbox",
    title: "Bug report received",
    description: "A visitor reports a bug from the footer.",
    defaultEnabled: false,
  },
  {
    key: "user-signed-up",
    group: "People",
    title: "New user signed up",
    description: "A new website account is created.",
    defaultEnabled: false,
  },
  {
    key: "profile-completed",
    group: "People",
    title: "Profile completed",
    description: "A user finishes profile setup.",
    defaultEnabled: false,
  },
  {
    key: "client-pr-logged",
    group: "People",
    title: "Client logged a PR",
    description: "A coaching client logs a new personal record themselves (not coach-logged).",
    defaultEnabled: false,
  },
  {
    key: "visitor-milestones",
    group: "Milestones",
    title: "Visitor milestones",
    description: `Lifetime unique visitors reach ${joinList(VISITOR_MILESTONES)}.`,
    defaultEnabled: false,
  },
  {
    key: "user-milestones",
    group: "Milestones",
    title: "User milestones",
    description: `Website accounts reach ${joinList(USER_MILESTONES)}.`,
    defaultEnabled: false,
  },
  {
    key: "online-milestones",
    group: "Milestones",
    title: "Online-at-once milestones",
    description: `${joinList(ONLINE_MILESTONES)} visitors on the site within the same 5 minutes.`,
    defaultEnabled: false,
  },
  {
    key: "weekly-summary",
    group: "Digests",
    title: "Weekly summary",
    description:
      "Every Monday morning: visitors, sign-ups, applications, PRs and bug reports from the past week.",
    defaultEnabled: false,
  },
]

export const NOTIFICATION_GROUPS: readonly NotificationGroup[] = [
  "Inbox",
  "People",
  "Milestones",
  "Digests",
]

export const NOTIFICATION_KEYS: readonly NotificationKey[] = NOTIFICATIONS.map((n) => n.key)

export function isNotificationKey(value: string): value is NotificationKey {
  return (NOTIFICATION_KEYS as readonly string[]).includes(value)
}

export function notificationDefault(key: NotificationKey) {
  return NOTIFICATIONS.find((n) => n.key === key)?.defaultEnabled ?? false
}

/**
 * Thresholds that `count` has passed and that haven't been emailed yet, ascending.
 * Callers email only the last one (the highest) and record all of them, so enabling the
 * toggle late never produces a burst of "100! 500! 1,000!" emails.
 */
export function newlyCrossed(
  thresholds: readonly number[],
  count: number,
  reached: ReadonlySet<number>,
): number[] {
  return thresholds.filter((threshold) => count >= threshold && !reached.has(threshold))
}
