import { DASHBOARD_NAV, isNavMenu, siteConfig, type NavLink, type NavMenuKind } from "@/config/site"
import type { ComingSoonLists, ComingSoonNavItem } from "@/features/coming-soon/schema"

/** A menu as the nav renders it: the configured links plus any coming-soon teasers. */
export interface NavMenuView {
  title: string
  kind?: NavMenuKind
  items: readonly NavLink[]
  comingSoon: readonly ComingSoonNavItem[]
}

export type NavEntryView = NavLink | NavMenuView

export function isNavMenuView(entry: NavEntryView): entry is NavMenuView {
  return "items" in entry
}

export interface NavAudience {
  /** A coaching client: the dashboard is their home and the lander is off limits. */
  client: boolean
  /** May use the client-only areas (clients and admins). */
  unlocked: boolean
  comingSoon: ComingSoonLists | null
}

/**
 * The nav for one visitor, built once in the header and handed to both the desktop and
 * mobile navs so they can never disagree.
 *
 * - Clients get "Dashboard" in place of "Coaching" — `/` redirects them anyway.
 * - Admins who aren't clients keep "Coaching" and gain "Dashboard" beside it.
 * - Coming-soon teasers appear under Tools/Resources for anyone unlocked; nobody else
 *   sees them, so the public nav stays exactly `siteConfig.mainNav`.
 */
export function buildNavEntries({ client, unlocked, comingSoon }: NavAudience): NavEntryView[] {
  const entries: NavEntryView[] = []

  for (const entry of siteConfig.mainNav) {
    if (isNavMenu(entry)) {
      const teasers = unlocked && comingSoon && entry.kind ? comingSoon[entry.kind] : []
      entries.push({ ...entry, comingSoon: teasers })
      continue
    }

    if (entry.href === "/") {
      if (client) {
        entries.push(DASHBOARD_NAV)
        continue
      }
      entries.push(entry)
      if (unlocked) entries.push(DASHBOARD_NAV)
      continue
    }

    entries.push(entry)
  }

  return entries
}
