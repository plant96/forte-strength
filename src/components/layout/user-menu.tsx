"use client"

import { useAuth, UserButton } from "@clerk/nextjs"
import { LayoutDashboardIcon, ShieldCheckIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

interface UserMenuProps {
  isAdmin: boolean
  /** A coaching client: gets a Dashboard entry. */
  client?: boolean
  /** Only Clerk's own entries (manage account, sign out) — for the locked-down header. */
  minimal?: boolean
}

/** Sign-in link when signed out; the account avatar menu when signed in. */
export function UserMenu({ isAdmin, client = false, minimal = false }: UserMenuProps) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return <Skeleton className="size-8 rounded-full" />

  if (!isSignedIn) {
    return (
      <Button
        asChild
        variant="ghost"
        size="sm"
        className="hidden text-muted-foreground md:inline-flex"
      >
        <Link href="/sign-in">Sign in</Link>
      </Button>
    )
  }

  return (
    <UserButton appearance={{ elements: { avatarBox: "size-8" } }}>
      {!minimal && (
        <UserButton.MenuItems>
          {client && (
            <UserButton.Link
              label="Dashboard"
              labelIcon={<LayoutDashboardIcon className="size-4" />}
              href="/dashboard"
            />
          )}
          <UserButton.Link
            label="Profile & settings"
            labelIcon={<UserRoundIcon className="size-4" />}
            href="/profile"
          />
          {isAdmin && (
            <UserButton.Link
              label="Admin panel"
              labelIcon={<ShieldCheckIcon className="size-4" />}
              href="/admin"
            />
          )}
        </UserButton.MenuItems>
      )}
    </UserButton>
  )
}
