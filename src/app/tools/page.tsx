import { cn } from "cn"
import { ArrowRightIcon, LockIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { ToolShell } from "@/components/layout/tool-shell"
import { CoachingCta } from "@/components/marketing/coaching-cta"
import { NAV_ICONS } from "@/components/layout/nav-icons"
import { LOCKED_NAV_HINT, tools } from "@/config/site"
import { canAccessClientArea, getCurrentUser } from "@/server/auth"

const description =
  "Free, transparent tools for lifters — built on the same maths and methods used with Tyler's roster."

export const metadata: Metadata = {
  title: "Tools",
  description,
  alternates: { canonical: "/tools" },
  openGraph: { title: "Tools | Forte Strength Systems", description, url: "/tools" },
}

export default async function ToolsPage() {
  const unlocked = canAccessClientArea(await getCurrentUser())

  return (
    <ToolShell title="Tools" description={description} footer={<CoachingCta />}>
      <ul className="grid gap-4 sm:grid-cols-2">
        {tools.map((tool) => {
          const Icon = tool.icon ? NAV_ICONS[tool.icon] : null
          const locked = Boolean(tool.locked) && !unlocked

          return (
            <li key={tool.href}>
              <Link
                href={tool.href}
                className={cn(
                  "group flex h-full flex-col gap-3 rounded-2xl bg-card p-5 ring-1 transition-colors",
                  locked
                    ? "ring-foreground/10 hover:ring-primary/30"
                    : "ring-foreground/10 hover:ring-primary/40",
                )}
              >
                <span className="flex items-center gap-3">
                  {Icon && (
                    <span
                      className={cn(
                        "grid size-10 place-items-center rounded-xl transition-colors",
                        locked ? "bg-muted text-muted-foreground" : "bg-primary/15 text-highlight",
                      )}
                    >
                      <Icon className="size-5" />
                    </span>
                  )}
                  <span
                    className={cn(
                      "flex items-center gap-1.5 font-heading text-lg font-bold tracking-tight uppercase",
                      locked && "text-muted-foreground",
                    )}
                  >
                    {tool.title}
                    {locked && <LockIcon className="size-3.5" />}
                  </span>
                </span>

                <span className="text-sm text-muted-foreground">{tool.description}</span>

                <span
                  className={cn(
                    "mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium",
                    locked ? "text-muted-foreground" : "text-highlight",
                  )}
                >
                  {locked ? LOCKED_NAV_HINT : "Open"}
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </ToolShell>
  )
}
