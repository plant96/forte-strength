import { cn } from "cn"
import { ArrowRightIcon, SparklesIcon, UserRoundPlusIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"

/** Where a visitor stands with the site's accounts, as far as the calculators care. */
export type AccountState = "signed-out" | "needs-profile" | "complete"

const NUDGES = {
  "signed-out": {
    message: "Create an account to save your metrics",
    action: "Sign up",
    href: "/sign-up",
    Icon: UserRoundPlusIcon,
  },
  "needs-profile": {
    message: "Complete your profile to autofill your metrics",
    action: "Set up profile",
    href: "/onboarding",
    Icon: SparklesIcon,
  },
} as const

interface AccountNudgeProps {
  state: AccountState
  className?: string
}

/** A small prompt beside a form's heading. Renders nothing once the profile exists. */
export function AccountNudge({ state, className }: AccountNudgeProps) {
  if (state === "complete") return null
  const { message, action, href, Icon } = NUDGES[state]

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-xs tracking-normal text-muted-foreground normal-case",
        className,
      )}
    >
      <Icon className="size-3.5 shrink-0 text-highlight" aria-hidden="true" />
      <span>{message}</span>
      <Button asChild size="xs" variant="outline" className="font-medium">
        <Link href={href}>
          {action}
          <ArrowRightIcon />
        </Link>
      </Button>
    </p>
  )
}
