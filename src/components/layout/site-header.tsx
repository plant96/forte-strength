import { ShieldCheckIcon } from "lucide-react"
import Link from "next/link"
import { unstable_rethrow } from "next/navigation"

import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import { DASHBOARD_NAV, siteConfig } from "@/config/site"
import { listComingSoon } from "@/features/coming-soon/queries"
import type { ComingSoonLists } from "@/features/coming-soon/schema"
import {
  canAccessClientArea,
  getCurrentUser,
  isAdmin,
  isClient,
  isLockedToOnboarding,
} from "@/server/auth"

import { MainNav } from "./main-nav"
import { MobileNav } from "./mobile-nav"
import { buildNavEntries } from "./nav-entries"
import { UserMenu } from "./user-menu"

interface NavAccess {
  admin: boolean
  /** May use the client-only entries (clients and admins). */
  unlocked: boolean
  /** A coaching client: the dashboard is home. */
  client: boolean
  /** Confined to the onboarding wizard for now. */
  locked: boolean
  comingSoon: ComingSoonLists | null
}

const SIGNED_OUT: NavAccess = {
  admin: false,
  unlocked: false,
  client: false,
  locked: false,
  comingSoon: null,
}

/**
 * One lookup for everything the nav needs. `getCurrentUser` is request-cached, so this
 * costs one query however many components ask for it; the teasers add one more, only
 * for the people who can see them.
 */
async function navAccess(): Promise<NavAccess> {
  try {
    const user = await getCurrentUser()
    const unlocked = canAccessClientArea(user)
    const comingSoon = unlocked
      ? await listComingSoon().catch((error: unknown) => {
          console.error("[header] Could not load coming-soon items:", error)
          return null
        })
      : null
    return {
      admin: isAdmin(user),
      unlocked,
      client: isClient(user),
      locked: isLockedToOnboarding(user),
      comingSoon,
    }
  } catch (error) {
    // Let Next.js handle its own signals (e.g. marking the route dynamic).
    unstable_rethrow(error)
    // The header must render even if the database is unreachable. Locked stays locked:
    // the routes re-check for themselves, so this only affects how the nav looks.
    console.error("[header] Could not load the current user:", error)
    return SIGNED_OUT
  }
}

const headerClass = "sticky top-0 z-40 border-b border-border/60 bg-background/70 backdrop-blur-lg"
const barClass = "mx-auto flex h-16 w-full max-w-6xl items-center gap-6 px-4 sm:px-6"

export async function SiteHeader() {
  const { admin, unlocked, client, locked, comingSoon } = await navAccess()

  if (locked) {
    // Nothing to navigate to yet: just the brand and a way to sign out.
    return (
      <header className={headerClass}>
        <div className={barClass}>
          <span className="shrink-0" aria-label={siteConfig.name}>
            <Logo />
          </span>
          <p className="hidden text-sm text-muted-foreground sm:block">
            Finish your profile to unlock the site.
          </p>
          <div className="ml-auto flex items-center gap-2">
            <UserMenu isAdmin={false} client={false} minimal />
          </div>
        </div>
      </header>
    )
  }

  const entries = buildNavEntries({ client, unlocked, comingSoon })
  const homeHref = client ? DASHBOARD_NAV.href : "/"
  const cta = client ? DASHBOARD_NAV : siteConfig.cta

  return (
    <header className={headerClass}>
      <div className={barClass}>
        <Link
          href={homeHref}
          aria-label={`${siteConfig.name} home`}
          className="shrink-0 rounded-lg focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Logo />
        </Link>

        <div className="hidden md:flex">
          <MainNav entries={entries} unlocked={unlocked} />
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
            <Link href={cta.href}>{cta.title}</Link>
          </Button>
          <UserMenu isAdmin={admin} client={client} />
          <MobileNav entries={entries} isAdmin={admin} unlocked={unlocked} client={client} />
        </div>
      </div>
    </header>
  )
}
