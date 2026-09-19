import { UserProfile } from "@clerk/nextjs"
import { ArrowLeftIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = { title: "Sign-in & security", robots: { index: false } }

export default function AccountPage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 sm:py-14">
      <Link
        href="/profile"
        className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        Back to profile
      </Link>
      <UserProfile
        path="/profile/account"
        appearance={{ elements: { rootBox: "w-full", cardBox: "w-full max-w-none" } }}
      />
    </div>
  )
}
