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
  async redirects() {
    return [
      // The vault's nav link lands on its first lift.
      {
        source: "/resources/mobility-vault",
        destination: "/resources/mobility-vault/squat",
        permanent: true,
      },
      // The lifts used to be top-level resource pages; keep old links and search
      // results working. The slugs mirror LIFT_SLUGS in src/features/resources/data.ts.
      {
        source: "/resources/:lift(squat|bench|deadlift)",
        destination: "/resources/mobility-vault/:lift",
        permanent: true,
      },
    ]
  },
}

export default nextConfig
