import { ExternalLinkIcon, PlayIcon } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { Badge } from "@/components/ui/badge"

import {
  liftHref,
  resourceLifts,
  VAULT,
  type ResourceBlock,
  type ResourceDrill,
  type ResourceLift,
} from "../data"
import { LiftSwitcher, type LiftTab } from "./lift-switcher"

function DrillCard({ drill }: { drill: ResourceDrill }) {
  // The card is a flex item inside its list item, so `w-full` keeps a drill with only a
  // line or two of text from shrinking to fit and stopping short of the column edge.
  return (
    <div className="flex h-full w-full flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h4 className="font-heading text-lg leading-tight font-bold uppercase">{drill.title}</h4>
        {drill.stance && (
          <Badge variant="outline" className="border-primary/40 text-highlight">
            {drill.stance === "Both" ? "Sumo & conventional" : drill.stance}
          </Badge>
        )}
      </div>

      {drill.prescription && (
        <p className="font-heading text-sm font-semibold tracking-[0.15em] text-highlight uppercase">
          {drill.prescription}
        </p>
      )}

      <p className="text-sm leading-relaxed text-pretty text-muted-foreground">{drill.detail}</p>

      {drill.href && (
        <a
          href={drill.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-auto inline-flex w-fit items-center gap-1.5 pt-1 text-sm font-medium text-highlight hover:underline"
        >
          <PlayIcon className="size-3.5" aria-hidden="true" />
          Watch {drill.title}
          <ExternalLinkIcon className="size-3" aria-hidden="true" />
        </a>
      )}
    </div>
  )
}

function Block({ block, headingId }: { block: ResourceBlock; headingId: string }) {
  return (
    <div className="flex flex-col gap-6">
      <Reveal className="flex flex-col gap-2">
        <h3 id={headingId} className="font-heading text-2xl font-bold uppercase sm:text-3xl">
          {block.title}
        </h3>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground sm:text-base">
          {block.summary}
        </p>
      </Reveal>

      <ul className="grid gap-4 sm:grid-cols-2">
        {block.drills.map((drill, index) => (
          <Reveal key={drill.title} as="li" delay={index * 0.06} className="flex">
            <DrillCard drill={drill} />
          </Reveal>
        ))}
      </ul>

      <Reveal>
        <div className="rounded-2xl bg-background/60 p-6 ring-1 ring-foreground/10">
          <h4 className="font-heading text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {block.extras.title}
          </h4>
          <ul className="mt-4 flex flex-wrap gap-2">
            {block.extras.items.map((item) => (
              <li
                key={item}
                className="rounded-full bg-muted/60 px-3 py-1.5 text-xs font-medium ring-1 ring-foreground/10"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>
    </div>
  )
}

const LIFT_TABS: LiftTab[] = resourceLifts.map((lift) => ({
  slug: lift.slug,
  title: lift.title,
  href: liftHref(lift.slug),
}))

/**
 * The vault's heading and lift switcher. The vault layout renders this above the lift
 * pages, so it stays put (and keeps focus on the chosen tab) while the lift changes.
 */
export function VaultHeader() {
  return (
    // The page heading, so it's an h1 — `SectionHeading` is fixed at h2.
    <header className="mx-auto flex w-full max-w-6xl flex-col px-4 pt-12 pb-4 sm:px-6 sm:pt-16">
      <Reveal className="flex flex-col gap-6">
        <div className="flex flex-col gap-3">
          <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
            {VAULT.eyebrow}
          </p>
          <h1 className="font-heading text-4xl leading-[1.02] font-extrabold text-balance uppercase sm:text-5xl">
            {VAULT.title}
          </h1>
          <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
            {VAULT.description}
          </p>
        </div>
        <div className="flex max-w-3xl flex-col gap-3 rounded-2xl bg-card/60 p-5 text-sm leading-relaxed text-pretty text-muted-foreground ring-1 ring-foreground/10">
          {VAULT.lines.map((line) => (
            <p key={line}>{line}</p>
          ))}
        </div>
        <LiftSwitcher lifts={LIFT_TABS} />
      </Reveal>
    </header>
  )
}

/** One lift's drills. Its heading is an h2: the vault header above it owns the h1. */
export function ResourceVault({ lift }: { lift: ResourceLift }) {
  return (
    <>
      <Reveal className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pt-8 sm:px-6 sm:pt-10">
        <h2 className="font-heading text-3xl leading-none font-bold uppercase sm:text-4xl">
          {lift.heading}
        </h2>
        <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
          {lift.description}
        </p>
      </Reveal>

      {lift.blocks.map((block, index) => {
        const headingId = `${lift.slug}-${block.title.toLowerCase()}`
        return (
          <section
            key={block.title}
            aria-labelledby={headingId}
            className={index % 2 === 0 ? undefined : "border-y border-border/60 bg-card/40"}
          >
            <div className="mx-auto w-full max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
              <Block block={block} headingId={headingId} />
            </div>
          </section>
        )
      })}
    </>
  )
}
