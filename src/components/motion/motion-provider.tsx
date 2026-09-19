"use client"

import { domAnimation, LazyMotion, MotionConfig } from "motion/react"

/** Loads Motion's DOM features once and respects the user's reduced-motion setting. */
export function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  )
}
