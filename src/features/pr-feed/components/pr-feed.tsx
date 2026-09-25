"use client"

import { cn } from "cn"
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  TrendingUpIcon,
  TrophyIcon,
} from "lucide-react"
import {
  AnimatePresence,
  m,
  useAnimationFrame,
  useInView,
  useMotionValue,
  usePageInView,
  type MotionValue,
  type Variants,
} from "motion/react"
import Link from "next/link"
import { Fragment, useRef, useState, useSyncExternalStore } from "react"

import { AnimatedNumber, formatAnimatedNumber } from "@/components/motion/animated-number"
import { LightSweep } from "@/components/motion/light-sweep"
import { Button } from "@/components/ui/button"
import { enter } from "@/features/dashboard/components/variants"
import { COMPETITION_LIFT_LABELS } from "@/features/pr-tracker/lib/lifts"
import { seriesLabel } from "@/features/pr-tracker/lib/series"
import { formatDelta, fromKg } from "@/features/pr-tracker/lib/weight"
import { describeDay, today, type Day } from "@/lib/day"
import type { WeightUnit } from "@/lib/units"

import {
  headlineWords,
  prSentence,
  type FeedPr,
  type SentenceSegment,
  type SentenceTone,
} from "../lib/feed"

/** How long each PR stays up before the next one slides in. */
const SLIDE_MS = 3850
/** A sideways swipe longer than this, in px, changes slide. */
const SWIPE_PX = 48
/** Caps one frame's step, so a stalled frame can't skip a slide outright. */
const MAX_FRAME_MS = 100
/** The headline's first word colours in as the paragraph starts to rise; then one per gap. */
const WORD_DELAY_MS = 340
const WORD_STAGGER_MS = 55

const ADD_HREF = "/tools/pr-tracker?panel=add"

const CARD = "relative min-w-0 overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10"

type Direction = 1 | -1

/** Next slides in from the right and leaves to the left; previous runs it backwards. */
const slide: Variants = {
  hidden: (direction: Direction) => ({ opacity: 0, x: 48 * direction, filter: "blur(8px)" }),
  show: {
    opacity: 1,
    x: 0,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 170,
      damping: 24,
      delayChildren: 0.08,
      staggerChildren: 0.06,
    },
  },
  exit: (direction: Direction) => ({
    opacity: 0,
    x: -48 * direction,
    filter: "blur(8px)",
    transition: { duration: 0.28, ease: "easeIn" },
  }),
}

const tile: Variants = {
  hidden: { opacity: 0, scale: 0.6, rotate: -12 },
  show: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: { type: "spring", stiffness: 260, damping: 16 },
  },
}

const rise: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 220, damping: 24 } },
}

/** The headline rises out of a blur as one block; its words colour in on their own. */
const headline: Variants = {
  hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 200, damping: 24 },
  },
}

/** A soft bloom of colour behind the lift tile as it lands. */
const glow: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  show: { opacity: 1, scale: 1, transition: { duration: 1.1, ease: "easeOut" } },
}

/** The lift's name drifts in behind the slide, slower and further than the slide itself. */
const watermark: Variants = {
  hidden: { opacity: 0, x: 96 },
  show: { opacity: 1, x: 0, transition: { duration: 1.6, ease: [0.16, 1, 0.3, 1] } },
}

const tick: Variants = {
  hidden: (direction: Direction) => ({ y: `${100 * direction}%`, opacity: 0 }),
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 320, damping: 28 } },
  exit: (direction: Direction) => ({
    y: `${-100 * direction}%`,
    opacity: 0,
    transition: { duration: 0.16 },
  }),
}

const TONES: Record<SentenceTone, string> = {
  subject: "text-foreground",
  weight: "text-primary",
  lift: "text-highlight",
  plain: "text-foreground/65",
}

const subscribeToNothing = () => () => {}

/**
 * The viewer's own calendar day, or null during the server render and hydration. "Today"
 * on a UTC server is often tomorrow for an American evening, and rendering it would make
 * the first client render disagree with the HTML. Slides wait for it rather than render
 * without it: adding "just" to a sentence already on screen would re-wrap it.
 */
function useViewerToday(): Day | null {
  return useSyncExternalStore(subscribeToNothing, today, () => null)
}

/** Keyboard focus pauses the feed; a mouse click on a button should not. */
function isFocusVisible(element: Element) {
  try {
    return element.matches(":focus-visible")
  } catch {
    return true
  }
}

/**
 * The team's latest squat, bench and deadlift PRs, one at a time.
 *
 * Auto-advances like a story reel, with a strip of segments showing where it is. It holds
 * still while the pointer is over it, while keyboard focus is inside, while it is scrolled
 * out of view or the tab is hidden, and when paused. Arrow keys and a sideways swipe step
 * through it by hand.
 */
export function PrFeed({ prs, unit }: { prs: FeedPr[]; unit: WeightUnit }) {
  if (prs.length === 0) {
    return (
      <m.section variants={enter} aria-labelledby="pr-feed-heading" className={CARD}>
        <FeedHeader live={false} />
        <EmptyFeed />
      </m.section>
    )
  }
  return <FeedCarousel prs={prs} unit={unit} />
}

function FeedCarousel({ prs, unit }: { prs: FeedPr[]; unit: WeightUnit }) {
  const count = prs.length
  const multiple = count > 1

  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<Direction>(1)
  const [paused, setPaused] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)

  const sectionRef = useRef<HTMLElement>(null)
  const swipeFrom = useRef<{ x: number; y: number } | null>(null)
  const inView = useInView(sectionRef, { amount: 0.3 })
  const pageVisible = usePageInView()
  const progress = useMotionValue(0)
  const now = useViewerToday()

  const running = multiple && !paused && !hovered && !focused && inView && pageVisible
  const position = index % count
  const pr = prs[position]!

  function go(step: Direction) {
    setDirection(step)
    setIndex((current) => (current + step + count) % count)
    progress.set(0)
  }

  // One clock drives both the strip and the advance, so a pause freezes the bar exactly
  // where the time is.
  useAnimationFrame((_, delta) => {
    if (!running) return
    const next = progress.get() + Math.min(delta, MAX_FRAME_MS) / SLIDE_MS
    if (next < 1) progress.set(next)
    else go(1)
  })

  return (
    <m.section
      ref={sectionRef}
      variants={enter}
      aria-labelledby="pr-feed-heading"
      aria-roledescription="carousel"
      className={CARD}
      onPointerEnter={(event) => event.pointerType === "mouse" && setHovered(true)}
      onPointerLeave={(event) => event.pointerType === "mouse" && setHovered(false)}
      onFocus={(event) => setFocused(isFocusVisible(event.target))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false)
      }}
      onKeyDown={(event) => {
        if (!multiple) return
        if (event.key === "ArrowRight") {
          event.preventDefault()
          go(1)
        } else if (event.key === "ArrowLeft") {
          event.preventDefault()
          go(-1)
        }
      }}
    >
      <FeedHeader live={running}>
        {multiple && (
          <div className="flex shrink-0 items-center gap-0.5">
            <Counter position={position} count={count} direction={direction} />
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Previous PR"
              onClick={() => go(-1)}
            >
              <ChevronLeftIcon />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label={paused ? "Play feed" : "Pause feed"}
              onClick={() => setPaused(!paused)}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="rounded-full"
              aria-label="Next PR"
              onClick={() => go(1)}
            >
              <ChevronRightIcon />
            </Button>
          </div>
        )}
      </FeedHeader>

      {multiple && <ProgressStrip count={count} position={position} progress={progress} />}

      <div
        // Slides share one grid cell, so the outgoing and incoming overlap without the
        // card changing height; the minimum fits a three-line sentence on a phone. The
        // column is a fixed fraction, never sized from content, so a slide's width can't
        // depend on anything mid-animation inside either of them.
        className="relative grid min-h-44 touch-pan-y grid-cols-1 sm:min-h-40"
        aria-live={running ? "off" : "polite"}
        onPointerDown={(event) => {
          // Touch and pen only: a mouse drag across the text is a selection, not a swipe.
          if (event.pointerType !== "mouse") {
            swipeFrom.current = { x: event.clientX, y: event.clientY }
          }
        }}
        onPointerUp={(event) => {
          const from = swipeFrom.current
          swipeFrom.current = null
          if (!from || !multiple) return
          const dx = event.clientX - from.x
          if (Math.abs(dx) > SWIPE_PX && Math.abs(dx) > Math.abs(event.clientY - from.y)) {
            go(dx < 0 ? 1 : -1)
          }
        }}
        onPointerCancel={() => {
          swipeFrom.current = null
        }}
      >
        <AnimatePresence custom={direction}>
          {now !== null && (
            <Slide
              key={pr.id}
              pr={pr}
              unit={unit}
              now={now}
              label={`${position + 1} of ${count}`}
              direction={direction}
            />
          )}
        </AnimatePresence>
      </div>
    </m.section>
  )
}

function FeedHeader({ live, children }: { live: boolean; children?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4 sm:px-6">
      <div className="flex min-w-0 flex-col gap-1">
        <p className="flex items-center gap-2 font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
          <LiveDot live={live} />
          Team feed
        </p>
        <h2 id="pr-feed-heading" className="font-heading text-2xl font-bold uppercase">
          Fresh PRs
        </h2>
      </div>
      {children}
    </div>
  )
}

/** Pulses while the feed is rolling, holds still while it is paused. */
function LiveDot({ live }: { live: boolean }) {
  return (
    <span aria-hidden="true" className="relative flex size-2">
      {live && (
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary opacity-75 motion-reduce:animate-none" />
      )}
      <span
        className={cn(
          "relative inline-flex size-2 rounded-full transition-colors",
          live ? "bg-primary" : "bg-muted-foreground/60",
        )}
      />
    </span>
  )
}

/** "03 / 20", the current number rolling up or down with the direction of travel. */
function Counter({
  position,
  count,
  direction,
}: {
  position: number
  count: number
  direction: Direction
}) {
  const pad = (value: number) => String(value).padStart(2, "0")
  return (
    <span
      aria-hidden="true"
      className="mr-1.5 flex items-baseline font-heading text-sm font-semibold text-muted-foreground tabular-nums"
    >
      <span className="relative inline-grid overflow-hidden text-foreground">
        <AnimatePresence initial={false} custom={direction}>
          <m.span
            key={position}
            custom={direction}
            variants={tick}
            initial="hidden"
            animate="show"
            exit="exit"
            className="col-start-1 row-start-1"
          >
            {pad(position + 1)}
          </m.span>
        </AnimatePresence>
      </span>
      <span className="px-1 text-muted-foreground/60">/</span>
      {pad(count)}
    </span>
  )
}

/** One segment per PR: done ones filled, the current one filling, the rest waiting. */
function ProgressStrip({
  count,
  position,
  progress,
}: {
  count: number
  position: number
  progress: MotionValue<number>
}) {
  return (
    <div aria-hidden="true" className="flex gap-1 px-5 pt-4 sm:px-6">
      {Array.from({ length: count }, (_, segment) => (
        <span
          key={segment}
          className="h-[3px] flex-1 overflow-hidden rounded-full bg-foreground/10"
        >
          {segment < position && <span className="block size-full bg-primary/45" />}
          {segment === position && (
            <m.span
              className="block size-full origin-left bg-primary"
              style={{ scaleX: progress }}
            />
          )}
        </span>
      ))}
    </div>
  )
}

function Slide({
  pr,
  unit,
  now,
  label,
  direction,
}: {
  pr: FeedPr
  unit: WeightUnit
  now: Day
  label: string
  direction: Direction
}) {
  const segments = prSentence(pr, unit, now)
  const lift = COMPETITION_LIFT_LABELS[pr.lift]
  const value = fromKg(pr.weightKg, unit)
  const decimals = Number.isInteger(value) ? 0 : 1

  return (
    <m.div
      role="group"
      aria-roledescription="slide"
      aria-label={label}
      custom={direction}
      variants={slide}
      initial="hidden"
      animate="show"
      exit="exit"
      className="relative col-start-1 row-start-1 flex items-center gap-4 px-5 py-6 sm:gap-6 sm:px-6"
    >
      <m.div
        variants={glow}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute top-1/2 -left-8 -mt-20 size-40 rounded-full blur-3xl",
          pr.mine ? "bg-gold/15" : "bg-primary/10",
        )}
      />
      {/* On a phone the sentence fills the slide, so the name would sit behind the words. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 hidden items-center overflow-hidden sm:flex"
      >
        <m.span
          variants={watermark}
          className="block pr-2 font-heading text-[9rem] leading-none font-extrabold text-foreground/[0.035] uppercase select-none lg:text-[10rem]"
        >
          {lift}
        </m.span>
      </div>
      <LightSweep delay={0.3} />

      <m.span
        variants={tile}
        aria-hidden="true"
        className={cn(
          "relative grid size-12 shrink-0 place-items-center rounded-xl font-heading text-2xl font-bold ring-1 sm:size-16 sm:text-3xl",
          pr.mine
            ? "bg-gold/15 text-gold ring-gold/40"
            : "bg-primary/15 text-highlight ring-primary/30",
        )}
      >
        {lift[0]}
      </m.span>

      <div className="relative flex min-w-0 flex-1 flex-col gap-2.5">
        <m.div variants={rise} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <span className="rounded-full bg-primary/15 px-2 py-0.5 font-heading font-semibold tracking-wider text-highlight uppercase ring-1 ring-primary/30">
            {seriesLabel(pr.shape)}
          </span>
          {pr.gainKg !== null && (
            <span className="inline-flex items-center gap-1 rounded-full bg-foreground/5 px-2 py-0.5 font-medium text-foreground tabular-nums ring-1 ring-foreground/10">
              <TrendingUpIcon aria-hidden="true" className="size-3 text-highlight" />
              {formatDelta(pr.gainKg, unit)}
            </span>
          )}
          <span className="text-muted-foreground">{describeDay(pr.achievedOn, now)}</span>
        </m.div>
        <Headline segments={segments} mine={pr.mine} />
      </div>

      {/* The sentence already says the weight; this is the scoreboard echo of it. */}
      <m.div
        variants={rise}
        aria-hidden="true"
        className="relative hidden shrink-0 flex-col items-end sm:flex"
      >
        {/* The final value, invisible, sets the column's width before the count starts.
            Counting up from 0 would otherwise widen it digit by digit and re-wrap the
            sentence beside it mid-count. */}
        <span
          className={cn(
            "grid justify-items-end font-heading text-5xl leading-none font-extrabold tabular-nums lg:text-6xl",
            pr.mine && "text-gold",
          )}
        >
          <span className="invisible col-start-1 row-start-1">
            {formatAnimatedNumber(value, decimals)}
          </span>
          <AnimatedNumber
            value={value}
            from={0}
            decimals={decimals}
            className="col-start-1 row-start-1"
          />
        </span>
        <span className="mt-1.5 font-heading text-xs font-semibold tracking-[0.3em] text-muted-foreground uppercase">
          {unit}
        </span>
      </m.div>
    </m.div>
  )
}

/**
 * The sentence, as ordinary inline text.
 *
 * Only the paragraph as a whole moves; the words inside it just colour in, one after
 * another. Nothing inside its line boxes is transformed, made inline-block or balanced, so
 * the browser lays the sentence out once and no engine can re-wrap it mid-animation. (When
 * each word was a rising inline-block in a `text-wrap: balance` paragraph, iOS Safari 18
 * stacked the words one per line until the animation finished.)
 */
function Headline({ segments, mine }: { segments: SentenceSegment[]; mine: boolean }) {
  return (
    <m.p
      variants={headline}
      className="font-heading text-2xl leading-[1.1] font-bold uppercase sm:text-3xl"
    >
      {headlineWords(segments).map((word, index) => (
        <Fragment key={index}>
          {index > 0 && " "}
          <span
            className={cn(
              "animate-word-in whitespace-nowrap motion-reduce:animate-none",
              word.tone === "subject" && mine ? "text-gold" : TONES[word.tone],
            )}
            style={{ animationDelay: `${WORD_DELAY_MS + index * WORD_STAGGER_MS}ms` }}
          >
            {word.text}
          </span>
        </Fragment>
      ))}
    </m.p>
  )
}

function EmptyFeed() {
  return (
    <div className="flex flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:px-6 sm:text-left">
      <span className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-highlight ring-1 ring-primary/30">
        <TrophyIcon className="size-6" />
      </span>
      <div className="flex flex-1 flex-col gap-1">
        <p className="font-heading text-lg font-bold uppercase">No team PRs yet</p>
        <p className="text-sm text-muted-foreground">
          Log a squat, bench or deadlift PR and it shows up here for the whole team.
        </p>
      </div>
      <Button asChild className="h-10 font-heading tracking-wider uppercase">
        <Link href={ADD_HREF}>
          <PlusIcon />
          Log a PR
        </Link>
      </Button>
    </div>
  )
}
