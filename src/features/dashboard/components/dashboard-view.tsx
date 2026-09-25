"use client"

import { m } from "motion/react"

import { PrFeed } from "@/features/pr-feed/components/pr-feed"
import type { FeedPr } from "@/features/pr-feed/lib/feed"
import type { BestLifts } from "@/features/pr-tracker/lib/lifts"
import type { WeightUnit } from "@/lib/units"

import { BestLiftsTable } from "./best-lifts-table"
import { Greeting } from "./greeting"
import { LinkList, type LinkListItem } from "./link-lists"
import { stagger } from "./variants"

interface DashboardViewProps {
  firstName: string | null
  lifts: BestLifts
  /** Null when the feed couldn't be read; the section is left out rather than empty. */
  prFeed: FeedPr[] | null
  unit: WeightUnit
  tools: LinkListItem[]
  resources: LinkListItem[]
}

/**
 * The client home. One choreography: the greeting rises first, then the team's PR feed,
 * then the lifts card and the two lists follow in a stagger; inside each, rows and numbers
 * take their turn. Two columns from `lg` up, a single stack below it.
 */
export function DashboardView({
  firstName,
  lifts,
  prFeed,
  unit,
  tools,
  resources,
}: DashboardViewProps) {
  return (
    <m.div
      variants={stagger(0.12, 0.05)}
      initial="hidden"
      animate="show"
      className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 sm:py-14"
    >
      <Greeting firstName={firstName} />

      {prFeed && <PrFeed prs={prFeed} unit={unit} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <BestLiftsTable lifts={lifts} unit={unit} />
        <m.div variants={stagger(0.1)} className="flex min-w-0 flex-col gap-6">
          <LinkList title="Tools" items={tools} />
          <LinkList title="Resources" items={resources} />
        </m.div>
      </div>
    </m.div>
  )
}
