"use client"

import { m } from "motion/react"

interface RevealProps {
  children: React.ReactNode
  className?: string
  /** Seconds to wait before animating in. */
  delay?: number
  as?: "div" | "li" | "section"
}

/** Fades and lifts content in the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0, as = "div" }: RevealProps) {
  const Component = m[as]
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ type: "spring", stiffness: 180, damping: 26, delay }}
    >
      {children}
    </Component>
  )
}
