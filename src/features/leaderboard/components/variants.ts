import type { Variants } from "motion/react"

import { spring } from "@/components/motion/variants"

export { enter, stagger } from "@/features/dashboard/components/variants"

/** A ranked row sliding in from the left; on the way out it slips right. */
export const row: Variants = {
  hidden: { opacity: 0, x: -14 },
  show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 200, damping: 26 } },
  exit: { opacity: 0, x: 14, transition: { duration: 0.15, ease: "easeIn" } },
}

/** A proportional bar growing from its left edge once its row has landed. */
export const bar: Variants = {
  hidden: { scaleX: 0 },
  show: { scaleX: 1, transition: { type: "spring", stiffness: 120, damping: 22, delay: 0.1 } },
}

/** A podium step rising into place. */
export const podiumTile: Variants = {
  hidden: { opacity: 0, y: 28, scale: 0.94 },
  show: { opacity: 1, y: 0, scale: 1, transition: spring },
}

/** A list that staggers its rows in and fades out as one when it's replaced. */
export function list(children = 0.06, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: children, delayChildren: delay } },
    exit: { opacity: 0, transition: { duration: 0.15, ease: "easeIn" } },
  }
}
