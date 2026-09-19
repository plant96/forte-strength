import { SignIn } from "@clerk/nextjs"
import type { Metadata } from "next"

import { AuthShell } from "../../auth-shell"

export const metadata: Metadata = { title: "Sign in" }

export default function SignInPage() {
  return (
    <AuthShell title="Welcome back" description="Sign in to autofill your tools from your profile.">
      <SignIn />
    </AuthShell>
  )
}
