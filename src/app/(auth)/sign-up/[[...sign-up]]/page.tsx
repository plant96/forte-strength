import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"

import { AuthShell } from "../../auth-shell"

export const metadata: Metadata = { title: "Create your account" }

/**
 * `/sign-up?onboarding=required` is the link the coach hands to new clients. The flag
 * rides along on Clerk's sign-up as unsafe metadata, lands on the account at first
 * sight (see `getCurrentUser`), and confines them to the profile wizard until it's done.
 */
export default async function SignUpPage(props: PageProps<"/sign-up/[[...sign-up]]">) {
  const { onboarding } = await props.searchParams
  const required = (Array.isArray(onboarding) ? onboarding[0] : onboarding) === "required"

  return (
    <AuthShell
      title="Create your free account"
      description={
        required
          ? "Your coach needs a few details before you start. Create your account, then set up your profile."
          : "Save your stats once and every Forte tool fills itself in."
      }
    >
      {required ? (
        <SignUp unsafeMetadata={{ onboardingRequired: true }} forceRedirectUrl="/onboarding" />
      ) : (
        <SignUp />
      )}
    </AuthShell>
  )
}
