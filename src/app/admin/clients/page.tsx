import { HandshakeIcon, SearchXIcon, TrophyIcon } from "lucide-react"
import Link from "next/link"
import type { Metadata } from "next"

import { AdminHeader, EmptyState, Pagination } from "@/features/admin/components/admin-ui"
import { SearchInput } from "@/features/admin/components/search-input"
import { OnboardingBadge, RoleBadge } from "@/features/admin/components/user-badges"
import { UserList, type UserColumn } from "@/features/admin/components/user-list"
import { listUsers } from "@/features/admin/queries"
import { parseUserFilters, toQueryString } from "@/features/admin/search-params"
import { formatDate } from "@/lib/dates"

export const metadata: Metadata = { title: "Clients" }

const COLUMNS: UserColumn[] = [
  {
    header: "Client since",
    // Always set here; the list only holds clients.
    cell: (user) => (user.clientSince ? formatDate(user.clientSince) : "—"),
    className: "text-muted-foreground",
  },
  {
    header: "Joined",
    cell: (user) => formatDate(user.createdAt),
    className: "text-muted-foreground",
  },
  {
    header: "Profile",
    cell: (user) => (
      <OnboardingBadge onboardedAt={user.onboardedAt} skippedAt={user.onboardingSkippedAt} />
    ),
  },
  { header: "Role", cell: (user) => <RoleBadge role={user.role} /> },
  {
    header: "PRs",
    // Sits above the row's own link overlay, so it wins the click.
    cell: (user) => (
      <Link
        href={`/admin/users/${user.id}/prs`}
        className="relative z-10 inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground ring-1 ring-foreground/10 transition-colors hover:bg-primary/15 hover:text-foreground hover:ring-primary/30"
      >
        <TrophyIcon className="size-3.5" />
        View
      </Link>
    ),
  },
]

export default async function AdminClientsPage(props: PageProps<"/admin/clients">) {
  const filters = parseUserFilters(await props.searchParams)
  const { items, total, pageCount } = await listUsers({ ...filters, clientsOnly: true })

  return (
    <>
      <AdminHeader
        title="Clients"
        description={`Website users who are also coaching clients (${total.toLocaleString("en-US")}). Mark someone as a client from their user page.`}
      >
        <div className="sm:w-80">
          <SearchInput label="Search clients" placeholder="Search name or email…" />
        </div>
      </AdminHeader>

      {items.length === 0 ? (
        filters.q ? (
          <EmptyState
            icon={SearchXIcon}
            title="No matches"
            description={`No clients match “${filters.q}”.`}
          />
        ) : (
          <EmptyState
            icon={HandshakeIcon}
            title="No clients yet"
            description="Open a website user and choose “Make client” to list them here."
          />
        )
      ) : (
        <>
          <UserList
            items={items}
            columns={COLUMNS}
            mobileMeta={(user) => (
              <>
                {user.clientSince && (
                  <span className="text-xs text-muted-foreground">
                    Client since {formatDate(user.clientSince)}
                  </span>
                )}
                <OnboardingBadge
                  onboardedAt={user.onboardedAt}
                  skippedAt={user.onboardingSkippedAt}
                />
                <RoleBadge role={user.role} />
              </>
            )}
          />

          <Pagination
            page={filters.page}
            pageCount={pageCount}
            hrefFor={(page) => `/admin/clients${toQueryString({ q: filters.q, page })}`}
          />
        </>
      )}
    </>
  )
}
