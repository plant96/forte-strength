import { stagger, type Transition, type Variants } from "motion/react"

const spring: Transition = { type: "spring", stiffness: 260, damping: 26 }

/** TDEE card: scales in first. */
export const summaryVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: spring },
}

/**
 * Bulk/Cut panels start tucked behind the TDEE card and slide out
 * (bulk upward, cut downward), then their tiles pop in one after another.
 */
export function goalPanelVariants(direction: "up" | "down"): Variants {
  const offset = direction === "up" ? 64 : -64
  return {
    hidden: { opacity: 0, y: offset, scale: 0.94 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { ...spring, delay: 0.2, delayChildren: stagger(0.06, { startDelay: 0.45 }) },
    },
  }
}

export const goalTileVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring },
}

export const fadeInLateVariants: Variants = {
  hidden: { opacity: 0, y: 8 },
  visible: { opacity: 1, y: 0, transition: { ...spring, delay: 0.85 } },
}
