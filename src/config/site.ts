/** Icons available to nav entries (mapped to components in the nav UI). */
export type NavIcon = "calculator"

export interface NavLink {
  title: string
  href: string
  description?: string
  icon?: NavIcon
}

export interface NavMenu {
  title: string
  items: NavLink[]
}

export type NavEntry = NavLink | NavMenu

export function isNavMenu(entry: NavEntry): entry is NavMenu {
  return "items" in entry
}

/** Free tools. Add new ones here and they appear in the nav's Tools menu and the sitemap. */
export const tools: NavLink[] = [
  {
    title: "TDEE Calculator",
    href: "/tdee-calculator",
    description: "Maintenance calories, bulk and cut targets, and macros.",
    icon: "calculator",
  },
]

export const siteConfig = {
  name: "Forte Strength Systems",
  shortName: "Forte Strength",
  url: "https://fortestrength.org",
  description:
    "Elite powerlifting coaching with Head Coach Tyler Montano, plus free, transparent tools for lifters.",
  mainNav: [
    { title: "Coaching", href: "/" },
    { title: "Tools", items: tools },
  ] satisfies NavEntry[],
  cta: { title: "Apply", href: "/application" },
} as const

/** Every public page linked from the nav, for the sitemap. */
export function publicNavHrefs() {
  const hrefs = siteConfig.mainNav.flatMap((entry) =>
    isNavMenu(entry) ? entry.items.map((item) => item.href) : [entry.href],
  )
  return [...new Set([...hrefs, siteConfig.cta.href])]
}
