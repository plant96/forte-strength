"use client"

import { ArrowRightIcon, SparklesIcon } from "lucide-react"
import { m } from "motion/react"
import Link from "next/link"

import { NAV_ICONS } from "@/components/layout/nav-icons"
import { SoonBadge } from "@/components/soon-badge"
import type { NavIcon } from "@/config/site"

import { enter, stagger } from "./variants"

export interface LinkListItem {
  key: string
  title: string
  /** Absent for a coming-soon teaser. */
  href?: string
  description?: string
  icon?: NavIcon
  comingSoon?: boolean
}

/** A titled card of links (Tools, Resources), with coming-soon teasers dimmed at the end. */
export function LinkList({ title, items }: { title: string; items: LinkListItem[] }) {
  return (
    <m.section
      variants={enter}
      aria-labelledby={`${title.toLowerCase()}-heading`}
      className="min-w-0 rounded-2xl bg-card ring-1 ring-foreground/10"
    >
      <h2
        id={`${title.toLowerCase()}-heading`}
        className="border-b border-border px-5 py-4 font-heading text-lg font-bold uppercase"
      >
        {title}
      </h2>
      <m.ul variants={stagger(0.06, 0.1)} className="flex flex-col gap-1 p-2">
        {items.map((item) => (
          <m.li key={item.key} variants={enter}>
            {item.href && !item.comingSoon ? (
              <LinkRow item={item} href={item.href} />
            ) : (
              <TeaserRow item={item} />
            )}
          </m.li>
        ))}
        {items.length === 0 && (
          <li className="px-3 py-4 text-sm text-muted-foreground">Nothing here yet.</li>
        )}
      </m.ul>
    </m.section>
  )
}

function LinkRow({ item, href }: { item: LinkListItem; href: string }) {
  const Icon = item.icon ? NAV_ICONS[item.icon] : null
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl p-3 transition-colors hover:bg-muted/60"
    >
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-primary/15 text-highlight">
        {Icon ? <Icon className="size-5" /> : <ArrowRightIcon className="size-5" />}
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="font-medium text-foreground">{item.title}</span>
        {item.description && (
          <span className="line-clamp-2 text-xs text-muted-foreground">{item.description}</span>
        )}
      </span>
      <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
    </Link>
  )
}

function TeaserRow({ item }: { item: LinkListItem }) {
  return (
    <div aria-disabled="true" className="flex cursor-default items-center gap-3 rounded-xl p-3">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <SparklesIcon className="size-5" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-2 font-medium text-muted-foreground">
          <span className="truncate">{item.title}</span>
          <SoonBadge label="Coming soon" />
        </span>
        {item.description && (
          <span className="line-clamp-2 text-xs text-muted-foreground">{item.description}</span>
        )}
      </span>
    </div>
  )
}
