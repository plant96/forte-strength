import { ChevronRightIcon } from "lucide-react"
import Link from "next/link"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import type { UserListItem } from "../queries"
import { Avatar, displayName } from "./user-badges"

export interface UserColumn {
  header: string
  cell: (user: UserListItem) => React.ReactNode
  className?: string
}

/**
 * Website users as a table on desktop and cards on mobile. The name column and the row
 * link are fixed; each page picks the columns after it and what the cards show.
 */
export function UserList({
  items,
  columns,
  mobileMeta,
}: {
  items: UserListItem[]
  columns: UserColumn[]
  /** Rendered under the name and email on the mobile cards, e.g. a row of badges. */
  mobileMeta: (user: UserListItem) => React.ReactNode
}) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl bg-card ring-1 ring-foreground/10 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="pl-5">User</TableHead>
              {columns.map((column) => (
                <TableHead key={column.header}>{column.header}</TableHead>
              ))}
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
                      <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                    </span>
                  </Link>
                </TableCell>
                {columns.map((column) => (
                  <TableCell key={column.header} className={column.className}>
                    {column.cell(user)}
                  </TableCell>
                ))}
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
                <span className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {mobileMeta(user)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
