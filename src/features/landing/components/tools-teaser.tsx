import { ArrowRightIcon, UserRoundPlusIcon } from "lucide-react"
import Link from "next/link"

import { NAV_ICONS } from "@/components/layout/nav-icons"
import { Reveal } from "@/components/motion/reveal"
import { tools } from "@/config/site"

import { SectionHeading } from "./section-heading"

export function ToolsTeaser() {
  return (
    <section aria-labelledby="tools-heading" className="border-t border-border/60 bg-card/40">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:items-center">
        <Reveal className="flex flex-col gap-5">
          <SectionHeading
            id="tools-heading"
            eyebrow="Free tools"
            title="Tools for every lifter"
            description="Transparent calculators that show their work, free for everyone. Create a free account and they fill themselves in."
          />
          <Link
            href="/sign-up"
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-highlight hover:underline"
          >
            <UserRoundPlusIcon className="size-4" />
            Create a free account
          </Link>
        </Reveal>

        <ul className="flex flex-col gap-3">
          {tools.map((tool, index) => {
            const Icon = tool.icon ? NAV_ICONS[tool.icon] : null
            return (
              <Reveal key={tool.href} as="li" delay={index * 0.06}>
                <Link
                  href={tool.href}
                  className="group flex items-center gap-4 rounded-2xl bg-background/60 p-5 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40"
                >
                  {Icon && (
                    <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/15 text-highlight ring-1 ring-primary/25">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                  )}
                  <span className="flex flex-1 flex-col gap-0.5">
                    <span className="font-heading text-lg font-bold uppercase">{tool.title}</span>
                    {tool.description && (
                      <span className="text-sm text-muted-foreground">{tool.description}</span>
                    )}
                  </span>
                  <ArrowRightIcon className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-foreground" />
                </Link>
              </Reveal>
            )
          })}
        </ul>
      </div>
    </section>
  )
}
