import { stagger, type Variants } from "motion/react"

import {
  fadeUpVariants,
  popInVariants,
  scaleInVariants,
  spring,
} from "@/components/motion/variants"

/** TDEE card: scales in first. */
export const summaryVariants = scaleInVariants

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

export const goalTileVariants = popInVariants

export const fadeInLateVariants = fadeUpVariants(0.85)
