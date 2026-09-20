import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    // AVIF first (~20% smaller than WebP), WebP for browsers without AVIF.
    formats: ["image/avif", "image/webp"],
    // Photos are statically imported, so their URLs are content-hashed: a new
    // file is a new URL and a long TTL can never serve a stale image.
    minimumCacheTTL: 2678400, // 31 days
    qualities: [75, 90],
  },
}

export default nextConfig
