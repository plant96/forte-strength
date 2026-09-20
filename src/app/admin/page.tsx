import {
  ArrowRightIcon,
  HandshakeIcon,
  InboxIcon,
  SparklesIcon,
  UserCheckIcon,
  UsersRoundIcon,
} from "lucide-react"
import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"

import { AdminHeader, StatTile, StatusBadge } from "@/features/admin/components/admin-ui"
import { getAdminCounts, getRecentActivity } from "@/features/admin/queries"
import { primaryNeedLabel } from "@/features/applications/format"
import { formatRelative } from "@/lib/dates"
import { requireAdmin } from "@/server/auth"

export const metadata: Metadata = { title: "Overview" }

export default async function AdminOverviewPage() {
  const admin = await requireAdmin()
  const [counts, recent] = await Promise.all([getAdminCounts(), getRecentActivity()])
  const onboardedShare = counts.users ? Math.round((counts.onboarded / counts.users) * 100) : 0

  return (
    <>
      <AdminHeader
        title={admin.firstName ? `Welcome back, ${admin.firstName}` : "Overview"}
        description="Coaching applications and website activity at a glance."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <StatTile
          label="New applications"
          value={counts.unprocessed}
          icon={SparklesIcon}
          hint="Waiting to be processed"
          href="/admin/applications"
          accent={counts.unprocessed > 0}
        />
        <StatTile
          label="All applications"
          value={counts.applications}
          icon={InboxIcon}
          hint={`${counts.processed} processed`}
          href="/admin/applications?status=all"
        />
        <StatTile
          label="Website users"
          value={counts.users}
          icon={UsersRoundIcon}
          hint="Accounts on the site"
          href="/admin/users"
        />
        <StatTile
          label="Profiles completed"
          value={counts.onboarded}
          icon={UserCheckIcon}
          hint={`${onboardedShare}% of users`}
        />
        <StatTile
          label="Clients"
          value={counts.clients}
          icon={HandshakeIcon}
          hint="Users marked as coaching clients"
          href="/admin/clients"
        />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="rounded-2xl bg-card ring-1 ring-foreground/10">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-heading text-lg font-bold uppercase">Latest applications</h2>
            <Link
              href="/admin/applications?status=all"
              className="inline-flex items-center gap-1 text-sm text-highlight hover:underline"
            >
              View all
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
          {recent.applications.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">
              No applications yet. They&apos;ll show up here as soon as someone applies.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.applications.map((application) => (
                <li key={application.id}>
                  <Link
                    href={`/admin/applications/${application.id}?status=all`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{application.fullName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {primaryNeedLabel(application)} · {formatRelative(application.createdAt)}
                      </p>
                    </div>
                    <StatusBadge status={application.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl bg-card ring-1 ring-foreground/10">
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <h2 className="font-heading text-lg font-bold uppercase">Newest users</h2>
            <Link
              href="/admin/users"
              className="inline-flex items-center gap-1 text-sm text-highlight hover:underline"
            >
              View all
              <ArrowRightIcon className="size-3.5" />
            </Link>
          </div>
          {recent.users.length === 0 ? (
            <p className="px-5 py-10 text-center text-sm text-muted-foreground">No users yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {recent.users.map((user) => (
                <li key={user.id}>
                  <Link
                    href={`/admin/users/${user.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/40"
                  >
                    <UserAvatar src={user.imageUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">
                        {[user.firstName, user.lastName].filter(Boolean).join(" ") || user.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Joined {formatRelative(user.createdAt)}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  )
}

function UserAvatar({ src }: { src: string | null }) {
  return src ? (
    <Image src={src} alt="" width={32} height={32} unoptimized className="size-8 rounded-full" />
  ) : (
    <span className="size-8 rounded-full bg-muted" />
  )
}
