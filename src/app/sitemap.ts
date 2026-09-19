import type { MetadataRoute } from "next"

import { siteConfig } from "@/config/site"

export default function sitemap(): MetadataRoute.Sitemap {
  return siteConfig.nav.map((item) => ({
    url: `${siteConfig.url}${item.href}`,
    changeFrequency: "monthly",
    priority: 1,
  }))
}
