"use client"

import { cn } from "cn"
import { m, useReducedMotion } from "motion/react"

interface LightSweepProps {
  /** Seconds after mount before the sweep starts; let the card land first. */
  delay?: number
  className?: string
}

/**
 * A single band of light that crosses a card once, left to right, after it has landed.
 * The parent needs `relative overflow-hidden`. Nothing renders under reduced motion.
 */
export function LightSweep({ delay = 0.6, className }: LightSweepProps) {
  const reduceMotion = useReducedMotion()
  if (reduceMotion) return null

  return (
    <m.div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-transparent via-primary/10 to-transparent",
        className,
      )}
      initial={{ x: "-100%" }}
      animate={{ x: "400%" }}
      transition={{ duration: 1.4, delay, ease: "easeInOut" }}
    />
  )
}
