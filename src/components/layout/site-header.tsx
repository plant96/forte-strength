import { ShieldCheckIcon } from "lucide-react"
import Link from "next/link"
import { unstable_rethrow } from "next/navigation"

import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { siteConfig } from "@/config/site"
import { getCurrentUser, isAdmin } from "@/server/auth"

import { MainNav } from "./main-nav"
import { MobileNav } from "./mobile-nav"
import { UserMenu } from "./user-menu"

async function currentUserIsAdmin() {
  try {
    return isAdmin(await getCurrentUser())
  } catch (error) {
    // Let Next.js handle its own signals (e.g. marking the route dynamic).
    unstable_rethrow(error)
    // The header must render even if the database is unreachable.
    console.error("[header] Could not load the current user:", error)
    return false
  }
}

export async function SiteHeader() {
  const admin = await currentUserIsAdmin()

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-lg">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
        <Link
          href="/"
          aria-label={`${siteConfig.name} home`}
          className="shrink-0 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo />
        </Link>

        <div className="hidden md:flex">
          <MainNav />
        </div>

        <div className="ml-auto flex items-center gap-2">
          {admin && (
            <Button
              asChild
              variant="outline"
              size="sm"
              className="hidden border-primary/50 text-highlight hover:bg-primary/15 hover:text-foreground md:inline-flex"
            >
              <Link href="/admin">
                <ShieldCheckIcon />
                Admin
              </Link>
            </Button>
          )}
          <Button
            asChild
            size="sm"
            className="hidden font-heading tracking-wider uppercase sm:inline-flex"
          >
            <Link href={siteConfig.cta.href}>{siteConfig.cta.title}</Link>
          </Button>
          <UserMenu isAdmin={admin} />
          <MobileNav isAdmin={admin} />
        </div>
      </div>
    </header>
  )
}
