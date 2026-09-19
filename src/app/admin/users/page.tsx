import { ChevronRightIcon, SearchXIcon, UsersRoundIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { AdminHeader, EmptyState, Pagination } from "@/features/admin/components/admin-ui"
import { SearchInput } from "@/features/admin/components/search-input"
import {
  Avatar,
  displayName,
  OnboardingBadge,
  RoleBadge,
} from "@/features/admin/components/user-badges"
import { listUsers } from "@/features/admin/queries"
import { parseUserFilters, toQueryString } from "@/features/admin/search-params"
import { formatDate } from "@/lib/dates"

export const metadata: Metadata = { title: "Website users" }

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
          <div className="hidden overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 md:block">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-5">User</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Profile</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="w-10" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((user) => (
                  <TableRow key={user.id} className="group relative">
                    <TableCell className="pl-5">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-3 after:absolute after:inset-0 after:content-['']"
                      >
                        <Avatar src={user.imageUrl} />
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate font-medium">{displayName(user)}</span>
                          <span className="truncate text-xs text-muted-foreground">
                            {user.email}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </TableCell>
                    <TableCell>
                      <OnboardingBadge
                        onboardedAt={user.onboardedAt}
                        skippedAt={user.onboardingSkippedAt}
                      />
                    </TableCell>
                    <TableCell>
                      <RoleBadge role={user.role} />
                    </TableCell>
                    <TableCell className="pr-4">
                      <ChevronRightIcon className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="flex flex-col gap-2 md:hidden">
            {items.map((user) => (
              <li key={user.id}>
                <Link
                  href={`/admin/users/${user.id}`}
                  className="flex items-center gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/10"
                >
                  <Avatar src={user.imageUrl} size={40} />
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="truncate font-medium">{displayName(user)}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    <OnboardingBadge
                      onboardedAt={user.onboardedAt}
                      skippedAt={user.onboardingSkippedAt}
                    />
                  </span>
                  <RoleBadge role={user.role} />
                </Link>
              </li>
            ))}
          </ul>

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
