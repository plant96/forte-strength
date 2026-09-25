import { stagger, type Transition, type Variants } from "motion/react"

/** The spring every results panel shares, so the calculators feel like one product. */
export const spring: Transition = { type: "spring", stiffness: 260, damping: 26 }

/** The hero card: scales in first. */
export const scaleInVariants: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: spring },
}

/** A group of tiles that slides in after the hero, then pops its children in one by one. */
export const popInGroupVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { ...spring, delay: 0.2, delayChildren: stagger(0.06, { startDelay: 0.45 }) },
  },
}

/** One tile inside a `popInGroupVariants` parent. */
export const popInVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.9 },
  visible: { opacity: 1, y: 0, scale: 1, transition: spring },
}

/** Trailing content (buttons, notes) that fades up once everything else has landed. */
export function fadeUpVariants(delay = 0.85): Variants {
  return {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0, transition: { ...spring, delay } },
  }
}
