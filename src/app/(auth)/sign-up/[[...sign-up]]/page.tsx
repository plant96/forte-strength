import { SignUp } from "@clerk/nextjs"
import type { Metadata } from "next"

import { AuthShell } from "../../auth-shell"

export const metadata: Metadata = { title: "Create your account" }

export default function SignUpPage() {
  return (
    <AuthShell
      title="Create your free account"
      description="Save your stats once and every Forte tool fills itself in."
    >
      <SignUp />
    </AuthShell>
  )
}
