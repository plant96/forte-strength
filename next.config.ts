import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  reactCompiler: true,
  redirects() {
    return [
      {
        // Temporary (307) because "/" will become a real homepage later.
        source: "/",
        destination: "/tdee-calculator",
        permanent: false,
      },
    ]
  },
}

export default nextConfig
