import {
  ArrowUpFromLineIcon,
  CalculatorIcon,
  DumbbellIcon,
  type LucideIcon,
  PersonStandingIcon,
  TrophyIcon,
  VaultIcon,
} from "lucide-react"

import type { NavIcon } from "@/config/site"

export const NAV_ICONS: Record<NavIcon, LucideIcon> = {
  calculator: CalculatorIcon,
  trophy: TrophyIcon,
  vault: VaultIcon,
  squat: PersonStandingIcon,
  bench: DumbbellIcon,
  deadlift: ArrowUpFromLineIcon,
}

export function isActivePath(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`)
}
