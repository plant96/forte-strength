import { ExternalLinkIcon, PlayIcon } from "lucide-react"

import { Reveal } from "@/components/motion/reveal"
import { Badge } from "@/components/ui/badge"

import type { ResourceBlock, ResourceDrill, ResourceLift } from "../data"
import { VAULT_INTRO } from "../data"

function DrillCard({ drill }: { drill: ResourceDrill }) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-heading text-lg leading-tight font-bold uppercase">{drill.title}</h3>
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
        <h2 id={headingId} className="font-heading text-2xl font-bold uppercase sm:text-3xl">
          {block.title}
        </h2>
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
          <h3 className="font-heading text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            {block.extras.title}
          </h3>
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

export function ResourceVault({ lift }: { lift: ResourceLift }) {
  return (
    <>
      {/* The page heading, so it's an h1 — `SectionHeading` is fixed at h2. */}
      <header className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 pt-12 pb-4 sm:px-6 sm:pt-16">
        <Reveal className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
              {VAULT_INTRO.eyebrow}
            </p>
            <h1 className="font-heading text-4xl leading-[1.02] font-extrabold text-balance uppercase sm:text-5xl">
              {lift.heading}
            </h1>
            <p className="max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">
              {lift.description}
            </p>
          </div>
          <div className="flex max-w-3xl flex-col gap-3 rounded-2xl bg-card/60 p-5 text-sm leading-relaxed text-pretty text-muted-foreground ring-1 ring-foreground/10">
            {VAULT_INTRO.lines.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
        </Reveal>
      </header>

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
