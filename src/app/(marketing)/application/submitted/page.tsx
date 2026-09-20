import { auth } from "@clerk/nextjs/server"
import {
  ArrowRightIcon,
  CalculatorIcon,
  CheckIcon,
  MailIcon,
  UserRoundPlusIcon,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getCoachProfile } from "@/features/coach/queries"

export const metadata: Metadata = {
  title: "Application received",
  robots: { index: false },
}

export default async function ApplicationSubmittedPage() {
  const [coach, { userId }] = await Promise.all([getCoachProfile(), auth()])

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="flex flex-col items-center gap-5">
        <span className="grid size-16 place-items-center rounded-full bg-primary/15 ring-1 ring-primary/40">
          <CheckIcon className="size-8 text-highlight" />
        </span>
        <h1 className="font-heading text-4xl leading-[1.02] font-extrabold uppercase sm:text-5xl">
          Application received
        </h1>
        <p className="max-w-xl text-base text-pretty text-muted-foreground sm:text-lg">
          Thanks for applying to Team Forte Strength. {coach.name} reads every application
          personally and will be in touch soon.
        </p>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <MailIcon className="size-4 text-highlight" aria-hidden="true" />
          We also emailed you a copy of your answers.
        </p>
      </div>

      <div className="grid w-full gap-4 text-left sm:grid-cols-2">
        <Link
          href="/tools/tdee-calculator"
          className="group flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40"
        >
          <CalculatorIcon className="size-6 text-highlight" aria-hidden="true" />
          <span className="font-heading text-lg font-bold uppercase">While you wait</span>
          <span className="text-sm text-muted-foreground">
            Work out your maintenance calories and macros with the free TDEE calculator.
          </span>
          <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-highlight">
            Open the calculator
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {userId ? (
          <Link
            href="/profile"
            className="group flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-foreground/10 transition-colors hover:ring-primary/40"
          >
            <UserRoundPlusIcon className="size-6 text-highlight" aria-hidden="true" />
            <span className="font-heading text-lg font-bold uppercase">Your profile</span>
            <span className="text-sm text-muted-foreground">
              Keep your stats up to date so every tool fills itself in.
            </span>
            <span className="mt-auto inline-flex items-center gap-1 text-sm font-medium text-highlight">
              Go to your profile
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl bg-card p-6 ring-1 ring-primary/30">
            <UserRoundPlusIcon className="size-6 text-highlight" aria-hidden="true" />
            <span className="font-heading text-lg font-bold uppercase">Create a free account</span>
            <span className="text-sm text-muted-foreground">
              Optional. Save your stats once and the site&apos;s tools fill themselves in for you.
            </span>
            <Button asChild className="mt-auto w-fit">
              <Link href="/sign-up">
                Create account
                <ArrowRightIcon />
              </Link>
            </Button>
          </div>
        )}
      </div>

      <Link href="/" className="text-sm text-muted-foreground hover:text-foreground">
        Back to home
      </Link>
    </div>
  )
}
