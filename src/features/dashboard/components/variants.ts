import type { Variants } from "motion/react"

/**
 * The dashboard's entrance choreography. Every block shares `enter`; parents stagger
 * their children with `stagger`. `MotionConfig reducedMotion="user"` (in the root
 * provider) strips the movement and blur for anyone who asked for less motion, leaving
 * a plain fade.
 */
export const enter: Variants = {
  hidden: { opacity: 0, y: 18, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 180, damping: 24 },
  },
}

export function stagger(children = 0.08, delay = 0): Variants {
  return {
    hidden: {},
    show: { transition: { staggerChildren: children, delayChildren: delay } },
  }
}
