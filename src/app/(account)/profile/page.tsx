import { ArrowRightIcon, CalculatorIcon, ShieldCheckIcon, UserCogIcon } from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { ProfileForm } from "@/features/profile/components/profile-form"
import { profileRecordToFormInput, profileRecordToTdeeInput } from "@/features/profile/mappers"
import { calculateTdee } from "@/features/tdee/lib/tdee"
import { isAdmin, requireUser, syncCurrentUser } from "@/server/auth"

export const metadata: Metadata = { title: "Profile & settings", robots: { index: false } }

export default async function ProfilePage() {
  const user = await syncCurrentUser(await requireUser())
  const profile = user.profile
  const estimate = profile ? calculateTdee(profileRecordToTdeeInput(profile)).tdee : null
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ") || "Your account"

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <header className="mb-8 flex flex-col gap-2">
        <p className="font-heading text-xs font-semibold tracking-[0.3em] text-primary uppercase">
          Settings
        </p>
        <h1 className="font-heading text-4xl leading-[1.02] font-extrabold uppercase sm:text-5xl">
          Profile &amp; settings
        </h1>
        <p className="text-muted-foreground">
          These stats autofill the calculators. You can still change them on any tool.
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:gap-8">
        <ProfileForm initialValues={profile ? profileRecordToFormInput(profile) : null} />

        <aside className="flex flex-col gap-4 lg:sticky lg:top-24">
          <div className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
            <div className="flex items-center gap-3">
              {user.imageUrl ? (
                <Image
                  src={user.imageUrl}
                  alt=""
                  width={48}
                  height={48}
                  unoptimized
                  className="size-12 rounded-full ring-1 ring-foreground/10"
                />
              ) : (
                <span className="size-12 rounded-full bg-muted" />
              )}
              <div className="min-w-0">
                <p className="truncate font-medium">{name}</p>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button asChild variant="outline" className="h-10">
              <Link href="/profile/account">
                <UserCogIcon />
                Manage sign-in &amp; security
              </Link>
            </Button>
            {isAdmin(user) && (
              <Button asChild variant="outline" className="h-10 border-primary/50 text-highlight">
                <Link href="/admin">
                  <ShieldCheckIcon />
                  Admin panel
                </Link>
              </Button>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl bg-card p-5 ring-1 ring-primary/30">
            <p className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
              Your maintenance
            </p>
            {estimate ? (
              <p className="flex items-baseline gap-2">
                <span className="font-heading text-5xl leading-none font-bold">
                  {Math.round(estimate).toLocaleString("en-US")}
                </span>
                <span className="text-sm text-muted-foreground">kcal/day</span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Save your profile to see your estimated maintenance calories.
              </p>
            )}
            <Link
              href="/tdee-calculator"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-highlight hover:underline"
            >
              <CalculatorIcon className="size-4" />
              Open the TDEE calculator
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}
