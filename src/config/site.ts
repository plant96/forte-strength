export const siteConfig = {
  name: "Forte Strength Systems",
  shortName: "Forte Strength",
  url: "https://fortestrength.org",
  description:
    "Evidence-based tools for lifters and strength athletes, starting with a transparent TDEE calculator.",
  nav: [{ title: "TDEE Calculator", href: "/tdee-calculator" }],
} as const

export type NavItem = (typeof siteConfig.nav)[number]
