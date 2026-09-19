"use client"

import { useAuth } from "@clerk/nextjs"
import { cn } from "cn"
import { MenuIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

import { Logo } from "@/components/brand/logo"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { isNavMenu, siteConfig } from "@/config/site"

import { isActivePath, NAV_ICONS } from "./nav-icons"

/** Slide-out navigation for small screens. */
export function MobileNav({ isAdmin }: { isAdmin: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { isSignedIn } = useAuth()
  const close = () => setOpen(false)

  const linkClass = (href: string) =>
    cn(
      "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors hover:bg-muted/60",
      isActivePath(pathname, href) ? "bg-muted/60 text-foreground" : "text-muted-foreground",
    )

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open menu">
          <MenuIcon className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="right"
        className="gap-0 data-[side=right]:w-full data-[side=right]:max-w-xs"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle asChild>
            <div>
              <Logo />
            </div>
          </SheetTitle>
          <SheetDescription className="sr-only">Site navigation</SheetDescription>
        </SheetHeader>

        <nav aria-label="Mobile" className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5">
          <div className="flex flex-col gap-1">
            {siteConfig.mainNav.map((entry) =>
              isNavMenu(entry) ? (
                <div key={entry.title} className="flex flex-col gap-1 pt-2">
                  <p className="px-3 pb-1 font-heading text-xs font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                    {entry.title}
                  </p>
                  {entry.items.map((item) => {
                    const Icon = item.icon ? NAV_ICONS[item.icon] : null
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={close}
                        className={linkClass(item.href)}
                      >
                        {Icon && <Icon className="size-4 text-highlight" />}
                        {item.title}
                      </Link>
                    )
                  })}
                </div>
              ) : (
                <Link
                  key={entry.href}
                  href={entry.href}
                  onClick={close}
                  className={linkClass(entry.href)}
                >
                  {entry.title}
                </Link>
              ),
            )}
          </div>

          <div className="flex flex-col gap-2 border-t border-border pt-5">
            <Button asChild size="lg" className="h-11 font-heading tracking-wider uppercase">
              <Link href={siteConfig.cta.href} onClick={close}>
                Apply for coaching
              </Link>
            </Button>
            {isSignedIn ? (
              <>
                <Link href="/profile" onClick={close} className={linkClass("/profile")}>
                  <UserRoundIcon className="size-4" />
                  Profile &amp; settings
                </Link>
                {isAdmin && (
                  <Link href="/admin" onClick={close} className={linkClass("/admin")}>
                    <ShieldCheckIcon className="size-4 text-highlight" />
                    Admin panel
                  </Link>
                )}
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Button asChild variant="outline" className="h-10">
                  <Link href="/sign-in" onClick={close}>
                    Sign in
                  </Link>
                </Button>
                <Button asChild variant="secondary" className="h-10">
                  <Link href="/sign-up" onClick={close}>
                    Create account
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </nav>
      </SheetContent>
    </Sheet>
  )
}
