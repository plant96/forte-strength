import { CalculatorIcon, type LucideIcon } from "lucide-react"

import type { NavIcon } from "@/config/site"

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  calculator: CalculatorIcon,
}

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}
