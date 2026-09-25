/** Icons available to nav entries and the vault's lift switcher (mapped to components in the nav UI). */
export type NavIcon = "calculator" | "medal" | "trophy" | "vault" | "squat" | "bench" | "deadlift"

export interface NavLink {
  title: string
  href: string
  description?: string
  icon?: NavIcon
  /**
   * Only reachable by coaching clients and admins. The nav dims these and marks them
   * with a lock; the route itself is gated server-side and renders an upsell instead.
   * Set per link, not per menu, so an open resource can sit beside a locked one.
   */
  locked?: boolean
}

/** The lists the coach can add "coming soon" teasers to. */
export type NavMenuKind = "tools" | "resources"

export interface NavMenu {
  title: string
  items: NavLink[]
  /** Which coming-soon list is appended under this menu (clients and admins only). */
  kind?: NavMenuKind
}

export type NavEntry = NavLink | NavMenu

export function isNavMenu(entry: NavEntry): entry is NavMenu {
  return "items" in entry
}

/** Free tools. Add new ones here and they appear in the nav's Tools menu and the sitemap. */
export const tools: NavLink[] = [
  {
    title: "TDEE Calculator",
    href: "/tools/tdee-calculator",
    description: "Maintenance calories, bulk and cut targets, and macros.",
    icon: "calculator",
  },
  {
    title: "DOTS / GLP Calculator",
    href: "/tools/dots-calculator",
    description: "DOTS, age-adjusted DOTS and GLP from your total, plus the total a score needs.",
    icon: "medal",
  },
  {
    title: "PR Tracker",
    href: "/tools/pr-tracker",
    description: "Log every personal record and watch the line climb.",
    icon: "trophy",
    locked: true,
  },
]

/**
 * The mobility vault's base path. Each lift is a page below it (`features/resources/data.ts`),
 * and this path itself redirects to the first lift (`next.config.ts`).
 */
export const MOBILITY_VAULT_PATH = "/resources/mobility-vault"

/** Resources. Add new ones here and they appear in the nav's Resources menu and the sitemap. */
export const resources: NavLink[] = [
  {
    title: "Mobility Vault",
    href: MOBILITY_VAULT_PATH,
    description: "Mobility, flexibility and warm-up drills for squat, bench and deadlift.",
    icon: "vault",
    locked: true,
  },
]

/** The line shown under a locked nav entry, in place of its description. */
export const LOCKED_NAV_HINT = "Coaching clients only — apply to unlock"

/**
 * The client home. Not part of `mainNav` (so it never reaches the sitemap); the header
 * splices it in for clients and admins — see `components/layout/nav-entries.ts`.
 */
export const DASHBOARD_NAV: NavLink = { title: "Dashboard", href: "/dashboard" }

export const siteConfig = {
  name: "Forte Strength Systems",
  shortName: "Forte Strength",
  url: "https://fortestrength.org",
  description:
    "Elite powerlifting coaching with Head Coach Tyler Montano, plus free, transparent tools for lifters.",
  mainNav: [
    { title: "Coaching", href: "/" },
    { title: "Gallery", href: "/gallery" },
    { title: "Leaderboard", href: "/leaderboard" },
    { title: "Tools", kind: "tools", items: tools },
    { title: "Resources", kind: "resources", items: resources },
  ] satisfies NavEntry[],
  cta: { title: "Apply", href: "/application" },
} as const

/**
 * Every public page linked from the nav, for the sitemap. Locked pages stay in:
 * they render an indexable preview that sells the coaching application.
 */
export function publicNavHrefs() {
  const hrefs = siteConfig.mainNav.flatMap((entry) =>
    isNavMenu(entry) ? entry.items.map((item) => item.href) : [entry.href],
  )
  return [...new Set([...hrefs, siteConfig.cta.href])]
}
