"use client"

import { cn } from "cn"
import Link from "next/link"
import { usePathname } from "next/navigation"

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { isNavMenu, siteConfig } from "@/config/site"

import { isActivePath, NAV_ICONS } from "./nav-icons"

const itemClass =
  "bg-transparent text-muted-foreground hover:bg-muted/60 hover:text-foreground data-active:text-foreground"

/** Desktop navigation, built from `siteConfig.mainNav`. */
export function MainNav() {
  const pathname = usePathname()

  return (
    <NavigationMenu viewport={false} aria-label="Main">
      <NavigationMenuList className="gap-1">
        {siteConfig.mainNav.map((entry) => {
          if (!isNavMenu(entry)) {
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

          const menuActive = entry.items.some((item) => isActivePath(pathname, item.href))
          return (
            <NavigationMenuItem key={entry.title}>
              <NavigationMenuTrigger className={cn(itemClass, menuActive && "text-foreground")}>
                {entry.title}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="min-w-80">
                <ul className="flex flex-col gap-1 p-1">
                  {entry.items.map((item) => {
                    const Icon = item.icon ? NAV_ICONS[item.icon] : null
                    const active = isActivePath(pathname, item.href)
                    return (
                      <li key={item.href}>
                        <NavigationMenuLink asChild active={active}>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className="flex items-start gap-3 rounded-lg p-3"
                          >
                            {Icon && (
                              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-highlight">
                                <Icon className="size-4.5" />
                              </span>
                            )}
                            <span className="flex flex-col gap-0.5">
                              <span className="font-medium text-foreground">{item.title}</span>
                              {item.description && (
                                <span className="text-xs leading-snug text-muted-foreground">
                                  {item.description}
                                </span>
                              )}
                            </span>
                          </Link>
                        </NavigationMenuLink>
                      </li>
                    )
                  })}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          )
        })}
      </NavigationMenuList>
    </NavigationMenu>
  )
}
