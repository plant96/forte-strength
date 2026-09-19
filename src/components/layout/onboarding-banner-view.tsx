"use client"

import { ArrowRightIcon, SparklesIcon } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export function OnboardingBannerView() {
  const pathname = usePathname()
  if (pathname.startsWith("/onboarding")) return null

  return (
    <div className="border-b border-primary/20 bg-primary/10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="flex items-center gap-2 text-foreground/90">
          <SparklesIcon className="size-4 shrink-0 text-highlight" aria-hidden="true" />
          Finish setting up your profile so your tools fill themselves in.
        </p>
        <Link
          href="/onboarding"
          className="inline-flex items-center gap-1 self-start font-medium text-highlight hover:underline sm:self-auto"
        >
          Finish setup
          <ArrowRightIcon className="size-3.5" />
        </Link>
      </div>
    </div>
  )
}
