"use client"

import { cn } from "cn"
import {
  InboxIcon,
  LayoutDashboardIcon,
  MedalIcon,
  UsersRoundIcon,
  type LucideIcon,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const ITEMS: { href: string; label: string; icon: LucideIcon; exact?: boolean }[] = [
  { href: "/admin", label: "Overview", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/applications", label: "Applications", icon: InboxIcon },
  { href: "/admin/users", label: "Website users", icon: UsersRoundIcon },
  { href: "/admin/coach", label: "Coach profile", icon: MedalIcon },
]

export function AdminNav({ unprocessed }: { unprocessed: number }) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Admin"
      className="-mx-4 overflow-x-auto px-4 lg:mx-0 lg:overflow-visible lg:px-0"
    >
      <ul className="flex w-max gap-1 lg:w-full lg:flex-col">
        {ITEMS.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "bg-primary/15 text-foreground ring-1 ring-primary/30"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <item.icon className={cn("size-4", active && "text-highlight")} />
                {item.label}
                {item.href === "/admin/applications" && unprocessed > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-1.5 py-0.5 text-[0.65rem] leading-none font-bold text-primary-foreground tabular-nums">
                    {unprocessed}
                  </span>
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
