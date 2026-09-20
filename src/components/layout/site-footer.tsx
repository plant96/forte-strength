import Link from "next/link"

import { siteConfig } from "@/config/site"

export function SiteFooter() {
  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>
          © {new Date().getFullYear()} {siteConfig.name}
        </p>
        <div className="flex flex-col gap-2 sm:items-end">
          <p>Estimates for educational purposes only. Not medical advice.</p>
          <Link
            href="/privacy"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Analytics privacy
          </Link>
        </div>
      </div>
    </footer>
  )
}
