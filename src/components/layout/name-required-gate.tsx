import { unstable_rethrow } from "next/navigation"

import { hasFullName } from "@/features/profile/lib/name"
import { getCurrentUser, type CurrentUser } from "@/server/auth"

import { NameRequiredDialog } from "./name-required-dialog"

async function userMissingName(): Promise<CurrentUser | null> {
  try {
    const user = await getCurrentUser()
    return user && !hasFullName(user) ? user : null
  } catch (error) {
    unstable_rethrow(error)
    // The header already logs database errors; a missing dialog is the safe failure.
    return null
  }
}

/** Mounts the mandatory name dialog for signed-in accounts that are missing a name. */
export async function NameRequiredGate() {
  const user = await userMissingName()
  if (!user) return null
  return (
    <NameRequiredDialog
      initialValues={{ firstName: user.firstName ?? "", lastName: user.lastName ?? "" }}
    />
  )
}
