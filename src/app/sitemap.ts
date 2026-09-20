import type { MetadataRoute } from "next"

import { MOBILITY_VAULT_PATH, publicNavHrefs, siteConfig } from "@/config/site"
import { LIFT_SLUGS, liftHref } from "@/features/resources/data"

export default function sitemap(): MetadataRoute.Sitemap {
  // The vault's nav href redirects to its first lift, so list the lift pages themselves.
  const hrefs = publicNavHrefs().flatMap((href) =>
    href === MOBILITY_VAULT_PATH ? LIFT_SLUGS.map(liftHref) : [href],
  )
  return hrefs.map((href) => ({
    url: `${siteConfig.url}${href === "/" ? "" : href}`,
    changeFrequency: "monthly",
    priority: href === "/" ? 1 : 0.8,
  }))
}
