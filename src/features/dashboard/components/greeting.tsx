"use client"

import { cn } from "cn"
import { m, type Variants } from "motion/react"

import { greetingName } from "@/features/profile/lib/name"

import { enter, stagger } from "./variants"

const word: Variants = {
  hidden: { y: "115%", opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 220, damping: 26 } },
}

/** "Hello, <first name>." — each word rises out of a clipped line, one after the other. */
export function Greeting({ firstName }: { firstName: string | null }) {
  const words = ["Hello,", `${greetingName(firstName)}.`]

  return (
    <m.header variants={enter} className="relative flex flex-col gap-3">
      <m.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 -left-24 -z-10 h-72 w-[28rem] rounded-full bg-primary/10 blur-3xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
      />
      <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
        Client dashboard
      </p>
      <m.h1
        variants={stagger(0.09)}
        className="font-heading text-5xl leading-[0.95] font-extrabold text-balance uppercase sm:text-6xl lg:text-7xl"
      >
        {words.map((text, index) => (
          <span
            key={index}
            className="mr-[0.22em] inline-block overflow-hidden pb-[0.06em] align-bottom last:mr-0"
          >
            <m.span
              variants={word}
              className={cn("inline-block", index === words.length - 1 && "text-primary")}
            >
              {text}
            </m.span>
          </span>
        ))}
      </m.h1>
      <m.p variants={enter} className="max-w-xl text-muted-foreground">
        Here&apos;s where you stand: your best lifts, what the team&apos;s been hitting, your tools,
        and what&apos;s coming next.
      </m.p>
    </m.header>
  )
}
