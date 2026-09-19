"use client"

import { m, useReducedMotion, useSpring, useTransform } from "motion/react"
import { useEffect } from "react"

interface AnimatedNumberProps {
  value: number
  /** Decimal places to show. */
  decimals?: number
  /** Where the first animation starts from. Defaults to `value` (no count-up). */
  from?: number
  className?: string
}

const formatters = new Map<number, Intl.NumberFormat>()

function getFormatter(decimals: number) {
  let formatter = formatters.get(decimals)
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
    formatters.set(decimals, formatter)
  }
  return formatter
}

/**
 * A number that springs to each new value. The animated text is hidden from
 * screen readers, which get the final value instead.
 */
export function AnimatedNumber({ value, decimals = 0, from, className }: AnimatedNumberProps) {
  const reduceMotion = useReducedMotion()
  const formatter = getFormatter(decimals)
  const spring = useSpring(from ?? value, { stiffness: 140, damping: 22, mass: 0.6 })
  const display = useTransform(spring, (latest) => formatter.format(latest))

  useEffect(() => {
    if (reduceMotion) spring.jump(value)
    else spring.set(value)
  }, [reduceMotion, spring, value])

  return (
    <span className={className}>
      <m.span aria-hidden="true" className="tabular-nums">
        {display}
      </m.span>
      <span className="sr-only">{formatter.format(value)}</span>
    </span>
  )
}
