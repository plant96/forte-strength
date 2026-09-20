"use client"

import { cn } from "cn"
import Link from "next/link"
import { useSelectedLayoutSegment } from "next/navigation"

import { NAV_ICONS } from "@/components/layout/nav-icons"

import type { LiftSlug } from "../data"

export interface LiftTab {
  slug: LiftSlug
  title: string
  href: string
}

/**
 * Tab-style links between the lifts. It lives in the vault layout, one level above the
 * lift pages, so the active segment is the lift and the links survive navigation.
 */
export function LiftSwitcher({ lifts }: { lifts: LiftTab[] }) {
  const active = useSelectedLayoutSegment()

  return (
    <nav
      aria-label="Choose a lift"
      className="grid grid-cols-3 gap-1 rounded-2xl bg-card p-1.5 ring-1 ring-foreground/10 sm:inline-flex sm:w-fit"
    >
      {lifts.map((lift) => {
        const Icon = NAV_ICONS[lift.slug]
        const current = lift.slug === active
        return (
          <Link
            key={lift.slug}
            href={lift.href}
            // The switcher sits under the intro; jumping back to the top would hide it.
            scroll={false}
            aria-current={current ? "page" : undefined}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-heading text-sm font-semibold tracking-wider uppercase transition-colors",
              current
                ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", current && "text-highlight")} aria-hidden="true" />
            {lift.title}
          </Link>
        )
      })}
    </nav>
  )
}
