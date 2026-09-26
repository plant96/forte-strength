import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { resources, tools, type NavLink } from "@/config/site"
import { listComingSoon } from "@/features/coming-soon/queries"
import { EMPTY_COMING_SOON, type ComingSoonNavItem } from "@/features/coming-soon/schema"
import { DashboardView } from "@/features/dashboard/components/dashboard-view"
import type { LinkListItem } from "@/features/dashboard/components/link-lists"
import { getTeamPrFeed } from "@/features/pr-feed/queries"
import { getBestLifts } from "@/features/pr-tracker/queries"
import { WEIGHT_UNIT_FROM_DB } from "@/features/profile/mappers"
import { getSmsState } from "@/features/sms/queries"
import { canAccessClientArea, requireUser } from "@/server/auth"

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
}

function listItems(links: NavLink[], teasers: ComingSoonNavItem[]): LinkListItem[] {
  return [
    ...links.map((link) => ({
      key: link.href,
      title: link.title,
      href: link.href,
      description: link.description,
      icon: link.icon,
    })),
    ...teasers.map((teaser) => ({ key: teaser.id, title: teaser.title, comingSoon: true })),
  ]
}

/**
 * The client home. Coaching clients land here from `/`; admins can visit to see what
 * their clients see. Anyone else signed in is sent to the lander (the proxy already
 * sends signed-out visitors to sign-in).
 */
export default async function DashboardPage() {
  const user = await requireUser()
  if (!canAccessClientArea(user)) redirect("/")

  const [lifts, prFeed, sms, comingSoon] = await Promise.all([
    getBestLifts(user.id),
    getTeamPrFeed(user.id),
    getSmsState(user),
    listComingSoon().catch((error: unknown) => {
      console.error("[dashboard] Could not load coming-soon items:", error)
      return EMPTY_COMING_SOON
    }),
  ])

  return (
    <DashboardView
      firstName={user.firstName}
      lifts={lifts}
      prFeed={prFeed}
      sms={sms}
      unit={WEIGHT_UNIT_FROM_DB[user.liftUnit]}
      tools={listItems(tools, comingSoon.tools)}
      resources={listItems(resources, comingSoon.resources)}
    />
  )
}
