import {
  ArrowLeftIcon,
  CalendarIcon,
  HandshakeIcon,
  MailIcon,
  MessageSquareTextIcon,
  TrophyIcon,
  UserRoundXIcon,
} from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { EmptyState } from "@/features/admin/components/admin-ui"
import {
  Avatar,
  ClientBadge,
  displayName,
  OnboardingBadge,
  RoleBadge,
} from "@/features/admin/components/user-badges"
import { UserClientToggle } from "@/features/admin/components/user-client-toggle"
import { UserDeletePanel } from "@/features/admin/components/user-delete-panel"
import { Button } from "@/components/ui/button"
import { getUserDetail } from "@/features/admin/queries"
import { ageOn, dateToBirthday, formatBirthday } from "@/features/profile/lib/birthday"
import { profileRecordToTdeeInput } from "@/features/profile/mappers"
import { formatUsPhone } from "@/features/sms/lib/phone"
import { getIntensityLevel, type IntensityId } from "@/features/tdee/lib/constants"
import { calculateTdee } from "@/features/tdee/lib/tdee"
import { formatDate, formatRelative } from "@/lib/dates"
import { cmToFtIn, roundTo } from "@/lib/units"
import { requireAdmin } from "@/server/auth"

export const metadata: Metadata = { title: "Website user" }

export default async function AdminUserPage(props: PageProps<"/admin/users/[id]">) {
  const admin = await requireAdmin()
  const { id } = await props.params
  const user = await getUserDetail(id)
  if (!user) notFound()
  // Never yourself, never another admin: those are handled by changing roles, deliberately.
  const canDelete = user.id !== admin.id && user.role !== "ADMIN"

  const profile = user.profile
  const result = profile ? calculateTdee(profileRecordToTdeeInput(profile)) : null
  const stats = profile && result ? profileStats(profile, result.input.intensity) : []

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/users"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Website users
      </Link>

      <header className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:p-6">
        <Avatar src={user.imageUrl} size={64} />
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 font-heading text-3xl leading-none font-bold wrap-anywhere uppercase">
              {displayName(user)}
            </h1>
            <RoleBadge role={user.role} />
            {user.clientSince && <ClientBadge />}
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <a
              href={`mailto:${user.email}`}
              className="inline-flex min-w-0 items-center gap-1.5 hover:text-foreground"
            >
              <MailIcon className="size-4 shrink-0 text-highlight" />
              <span className="truncate">{user.email}</span>
            </a>
            <span className="inline-flex items-center gap-1.5">
              <CalendarIcon className="size-4 text-highlight" />
              Joined {formatDate(user.createdAt)} ({formatRelative(user.createdAt)})
            </span>
            {user.clientSince && (
              <span className="inline-flex items-center gap-1.5">
                <HandshakeIcon className="size-4 text-highlight" />
                Client since {formatDate(user.clientSince)}
              </span>
            )}
            <span className="inline-flex items-center gap-1.5">
              <MessageSquareTextIcon className="size-4 text-highlight" />
              {user.smsOptInAt && user.smsPhone ? (
                <>
                  Texts on: {formatUsPhone(user.smsPhone)}, since {formatDate(user.smsOptInAt)}
                </>
              ) : user.clientSince ? (
                <>
                  Texts off. Ask them to turn texts on at{" "}
                  <Link href="/sms" className="text-highlight hover:underline">
                    fortestrength.org/sms
                  </Link>
                </>
              ) : (
                "Texts off"
              )}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <OnboardingBadge
            onboardedAt={user.onboardedAt}
            skippedAt={user.onboardingSkippedAt}
            required={user.onboardingRequired}
          />
          <Button asChild variant="outline" className="h-10">
            <Link href={`/admin/users/${user.id}/prs`}>
              <TrophyIcon />
              View PRs
            </Link>
          </Button>
          <UserClientToggle id={user.id} client={Boolean(user.clientSince)} />
        </div>
      </header>

      {profile && result ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <section
            aria-label="Profile stats"
            className="grid gap-px overflow-hidden rounded-2xl bg-border ring-1 ring-foreground/10 sm:grid-cols-2"
          >
            {stats.map((stat) => (
              <div key={stat.label} className="flex flex-col gap-1 bg-card p-4">
                <span className="text-xs text-muted-foreground">{stat.label}</span>
                <span className="text-sm font-medium">{stat.value}</span>
              </div>
            ))}
          </section>
          <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-primary/30">
            <h2 className="font-heading text-xs font-semibold tracking-[0.25em] text-muted-foreground uppercase">
              Estimated maintenance
            </h2>
            <p className="flex items-baseline gap-2">
              <span className="font-heading text-5xl leading-none font-bold">
                {Math.round(result.tdee).toLocaleString("en-US")}
              </span>
              <span className="text-sm text-muted-foreground">kcal/day</span>
            </p>
            <dl className="grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
              <div>
                <dt className="text-xs text-muted-foreground">BMR (average of 3)</dt>
                <dd className="font-medium">
                  {Math.round(result.bmr.average).toLocaleString("en-US")} kcal
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Activity multiplier</dt>
                <dd className="font-medium">× {result.activity.multiplier.toFixed(3)}</dd>
              </div>
            </dl>
            <p className="text-xs text-muted-foreground">
              Profile last updated {formatRelative(profile.updatedAt)}.
            </p>
          </section>
        </div>
      ) : (
        <EmptyState
          icon={UserRoundXIcon}
          title="No profile yet"
          description="This user hasn't saved their stats yet."
        />
      )}

      {canDelete && <UserDeletePanel id={user.id} name={displayName(user)} />}
    </div>
  )
}

type ProfileRecordWithDates = NonNullable<Awaited<ReturnType<typeof getUserDetail>>>["profile"]

function profileStats(profile: NonNullable<ProfileRecordWithDates>, intensity: IntensityId) {
  const birthday = dateToBirthday(profile.birthDate)
  const { ft, in: inches } = cmToFtIn(profile.heightCm)
  return [
    { label: "Age", value: `${ageOn(birthday)} (${formatBirthday(birthday)})` },
    { label: "Sex", value: profile.sex === "MALE" ? "Male" : "Female" },
    {
      label: "Bodyweight",
      value: `${roundTo(profile.weight, 1)} ${profile.weightUnit === "KG" ? "kg" : "lb"}`,
    },
    {
      label: "Height",
      value:
        profile.heightUnit === "CM" ? `${roundTo(profile.heightCm, 1)} cm` : `${ft}′ ${inches}″`,
    },
    { label: "Body fat", value: `${roundTo(profile.bodyFatPercent, 1)}%` },
    { label: "Daily steps", value: profile.stepsPerDay.toLocaleString("en-US") },
    { label: "Training", value: `${profile.sessionsPerWeek} sessions / week` },
    { label: "Intensity", value: getIntensityLevel(intensity).label },
  ]
}
