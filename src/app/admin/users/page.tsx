import { SearchXIcon, UsersRoundIcon } from "lucide-react"
import type { Metadata } from "next"

import { AdminHeader, EmptyState, Pagination } from "@/features/admin/components/admin-ui"
import { SearchInput } from "@/features/admin/components/search-input"
import { ClientBadge, OnboardingBadge, RoleBadge } from "@/features/admin/components/user-badges"
import { UserList, type UserColumn } from "@/features/admin/components/user-list"
import { listUsers } from "@/features/admin/queries"
import { parseUserFilters, toQueryString } from "@/features/admin/search-params"
import { formatDate } from "@/lib/dates"

export const metadata: Metadata = { title: "Website users" }

const COLUMNS: UserColumn[] = [
  {
    header: "Joined",
    cell: (user) => formatDate(user.createdAt),
    className: "text-muted-foreground",
  },
  {
    header: "Profile",
    cell: (user) => (
      <OnboardingBadge
        onboardedAt={user.onboardedAt}
        skippedAt={user.onboardingSkippedAt}
        required={user.onboardingRequired}
      />
    ),
  },
  {
    header: "Client",
    cell: (user) =>
      user.clientSince ? <ClientBadge /> : <span className="text-xs text-muted-foreground">—</span>,
  },
  { header: "Role", cell: (user) => <RoleBadge role={user.role} /> },
]

export default async function AdminUsersPage(props: PageProps<"/admin/users">) {
  const filters = parseUserFilters(await props.searchParams)
  const { items, total, pageCount } = await listUsers(filters)

  return (
    <>
      <AdminHeader
        title="Website users"
        description={`People with an account on the site (${total.toLocaleString("en-US")}). Separate from coaching applicants.`}
      >
        <div className="sm:w-80">
          <SearchInput label="Search users" placeholder="Search name or email…" />
        </div>
      </AdminHeader>

      {items.length === 0 ? (
        filters.q ? (
          <EmptyState
            icon={SearchXIcon}
            title="No matches"
            description={`No users match “${filters.q}”.`}
          />
        ) : (
          <EmptyState
            icon={UsersRoundIcon}
            title="No users yet"
            description="Accounts appear here when people sign up on the site."
          />
        )
      ) : (
        <>
          <UserList
            items={items}
            columns={COLUMNS}
            mobileMeta={(user) => (
              <>
                <OnboardingBadge
                  onboardedAt={user.onboardedAt}
                  skippedAt={user.onboardingSkippedAt}
                  required={user.onboardingRequired}
                />
                {user.clientSince && <ClientBadge />}
                <RoleBadge role={user.role} />
              </>
            )}
          />

          <Pagination
            page={filters.page}
            pageCount={pageCount}
            hrefFor={(page) => `/admin/users${toQueryString({ q: filters.q, page })}`}
          />
        </>
      )}
    </>
  )
}
