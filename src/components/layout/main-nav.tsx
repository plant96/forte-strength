"use client"

import { cn } from "cn"
import { LockIcon, SparklesIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useRef, useState, type MouseEvent } from "react"

import { SoonBadge } from "@/components/soon-badge"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { LOCKED_NAV_HINT } from "@/config/site"

import { isNavMenuView, type NavEntryView } from "./nav-entries"
import { isActivePath, NAV_ICONS } from "./nav-icons"

const itemClass =
  "bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground data-active:text-foreground"

/** Radix puts this value in element ids and `aria-controls`, so it can't contain spaces. */
function menuValue(title: string) {
  return title.toLowerCase().replace(/\s+/g, "-")
}

/**
 * Desktop navigation, built from the entries the header assembled for this visitor
 * (see `nav-entries.ts`).
 *
 * Menus open on hover, and clicking one pins it so it stays open once the pointer
 * leaves. Radix funnels every close through `onValueChange("")`, so pinning works by
 * ignoring that one call — rather than by suppressing pointer events, which would
 * leave Radix's own hover latches in a stale state. Every genuine dismissal (a second
 * click, Escape, an outside click, choosing a link) drops the pin first.
 */
export function MainNav({
  entries,
  unlocked,
}: {
  entries: readonly NavEntryView[]
  unlocked: boolean
}) {
  const pathname = usePathname()

  const [openValue, setOpenValue] = useState("")
  // A ref because it is written and read again inside a single click: Radix calls
  // `onValueChange` synchronously from the click handler, where a queued state
  // update would not be visible yet.
  const pinnedRef = useRef<string | null>(null)
  // Render-only mirror, so nothing has to read a ref during render.
  const [pinned, setPinned] = useState<string | null>(null)

  function pin(value: string | null) {
    pinnedRef.current = value
    setPinned(value)
  }

  function handleValueChange(next: string) {
    if (next === "") {
      // The only close that reaches here still pinned is the hover-out timer.
      if (pinnedRef.current !== null) return
    } else if (next !== pinnedRef.current) {
      // Opening a different menu, by hover or by click, drops the previous pin.
      pin(null)
    }
    setOpenValue(next)
  }

  function handleTriggerClick(event: MouseEvent<HTMLButtonElement>, value: string) {
    if (pinnedRef.current === value) {
      // Second click: drop the pin and let Radix toggle the menu shut.
      pin(null)
      return
    }
    pin(value)
    // Hover already opened it, so Radix's toggle would close it again. When it is
    // still closed (tap, Enter, or a click that beat the hover delay), let it open.
    if (openValue === value) event.preventDefault()
  }

  return (
    <NavigationMenu
      aria-label="Main"
      viewport={false}
      value={openValue}
      onValueChange={handleValueChange}
    >
      <NavigationMenuList className="gap-1">
        {entries.map((entry) => {
          if (!isNavMenuView(entry)) {
            const active = isActivePath(pathname, entry.href)
            return (
              <NavigationMenuItem key={entry.href}>
                <NavigationMenuLink asChild active={active}>
                  <Link
                    href={entry.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      navigationMenuTriggerStyle(),
                      itemClass,
                      active && "text-foreground",
                    )}
                  >
                    {entry.title}
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            )
          }

          const value = menuValue(entry.title)
          const menuActive = entry.items.some((item) => isActivePath(pathname, item.href))
          return (
            <NavigationMenuItem key={value} value={value}>
              <NavigationMenuTrigger
                data-pinned={pinned === value ? "" : undefined}
                onClick={(event) => handleTriggerClick(event, value)}
                className={cn(itemClass, menuActive && "text-foreground")}
              >
                {entry.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent
                className="min-w-80"
                onEscapeKeyDown={() => pin(null)}
                onInteractOutside={(event) => {
                  // Radix cancels interactions that must not dismiss — a trigger, or
                  // focus moving elsewhere inside the nav. Those keep the pin.
                  if (!event.defaultPrevented) pin(null)
                }}
              >
                <ul className="flex flex-col gap-1 p-1">
                  {entry.items.map((item) => {
                    const Icon = item.icon ? NAV_ICONS[item.icon] : null
                    const active = isActivePath(pathname, item.href)
                    // Locked entries stay clickable: they lead to a page that explains what
                    // is behind them and invites an application. Disabling them would be a
                    // dead end and would lose the pitch.
                    const locked = Boolean(item.locked) && !unlocked
                    return (
                      <li key={item.href}>
                        {/* Choosing a link dismisses through a DOM event rather than
                            the layer, so the pin has to be dropped here too. */}
                        <NavigationMenuLink asChild active={active} onSelect={() => pin(null)}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            aria-label={
                              locked ? item.title + " \u2014 " + LOCKED_NAV_HINT : undefined
                            }
                            className="flex items-start gap-3 rounded-lg p-3"
                          >
                            {Icon && (
                              <span
                                className={cn(
                                  "grid size-9 shrink-0 place-items-center rounded-lg",
                                  locked
                                    ? "bg-muted text-muted-foreground"
                                    : "bg-primary/15 text-highlight",
                                )}
                              >
                                <Icon className="size-4.5" />
                              </span>
                            )}
                            <span className="flex flex-col gap-0.5">
                              <span
                                className={cn(
                                  "flex items-center gap-1.5 font-medium",
                                  locked ? "text-muted-foreground" : "text-foreground",
                                )}
                              >
                                {item.title}
                                {locked && (
                                  <>
                                    <LockIcon className="size-3" aria-hidden />
                                    <span className="rounded-full bg-primary/15 px-1.5 py-px text-[10px] font-semibold tracking-wide text-highlight uppercase ring-1 ring-primary/30">
                                      Clients
                                    </span>
                                  </>
                                )}
                              </span>
                              {locked ? (
                                <span className="text-xs leading-snug text-highlight/80">
                                  {LOCKED_NAV_HINT}
                                </span>
                              ) : (
                                item.description && (
                                  <span className="text-xs leading-snug text-muted-foreground">
                                    {item.description}
                                  </span>
                                )
                              )}
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    )
                  })}
                  {/* Teasers: not links, because there is nowhere to go yet. */}
                  {entry.comingSoon.map((item) => (
                    <li key={item.id}>
                      <div
                        aria-disabled="true"
                        className="flex cursor-default items-start gap-3 rounded-lg p-3"
                      >
                        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                          <SparklesIcon className="size-4.5" />
                        </span>
                        <span className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1.5 font-medium text-muted-foreground">
                            {item.title}
                            <SoonBadge />
                          </span>
                          <span className="text-xs leading-snug text-muted-foreground">
                            Coming soon
                          </span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
