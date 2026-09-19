import type { MetadataRoute } from "next"

import { publicNavHrefs, siteConfig } from "@/config/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return publicNavHrefs().map((href) => ({
    url: `${siteConfig.url}${href === "/" ? "" : href}`,
    changeFrequency: "monthly",
    priority: href === "/" ? 1 : 0.8,
  }))
}
