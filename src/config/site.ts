/** Icons available to nav entries and the vault's lift switcher (mapped to components in the nav UI). */
export type NavIcon = "calculator" | "vault" | "squat" | "bench" | "deadlift"

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
    { title: "Gallery", href: "/gallery" },
    { title: "Tools", items: tools },
    { title: "Resources", items: resources },
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
