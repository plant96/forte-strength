"use client"

import { useAuth, UserButton } from "@clerk/nextjs"
import { ShieldCheckIcon, UserRoundIcon } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"

/** Sign-in link when signed out; the account avatar menu when signed in. */
export function UserMenu({ isAdmin }: { isAdmin: boolean }) {
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
      <UserButton.MenuItems>
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
    </UserButton>
  )
}
