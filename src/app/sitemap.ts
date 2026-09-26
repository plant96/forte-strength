import type { MetadataRoute } from "next"

import { MOBILITY_VAULT_PATH, publicNavHrefs, siteConfig } from "@/config/site"
import { LIFT_SLUGS, liftHref } from "@/features/resources/data"

/** Public pages that aren't in the nav. */
const EXTRA_HREFS = ["/sms", "/terms", "/privacy"]

export default function sitemap(): MetadataRoute.Sitemap {
  // The vault's nav href redirects to its first lift, so list the lift pages themselves.
  const hrefs = publicNavHrefs().flatMap((href) =>
    href === MOBILITY_VAULT_PATH ? LIFT_SLUGS.map(liftHref) : [href],
  )
  return [
    ...hrefs.map((href) => ({
      url: `${siteConfig.url}${href === "/" ? "" : href}`,
      changeFrequency: "monthly" as const,
      priority: href === "/" ? 1 : 0.8,
    })),
    ...EXTRA_HREFS.map((href) => ({
      url: `${siteConfig.url}${href}`,
      changeFrequency: "yearly" as const,
      priority: 0.3,
    })),
  ]
}
