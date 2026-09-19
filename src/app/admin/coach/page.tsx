import type { Metadata } from "next"

import { AdminHeader } from "@/features/admin/components/admin-ui"
import { CoachProfileForm } from "@/features/admin/components/coach-profile-form"
import { getCoachProfile } from "@/features/coach/queries"
import { coachProfileToFormInput } from "@/features/coach/schema"

export const metadata: Metadata = { title: "Coach profile" }

export default async function AdminCoachPage() {
  const profile = await getCoachProfile()

  return (
    <>
      <AdminHeader
        title="Coach profile"
        description="Your records, bio and team reach. Changes show up across the site for everyone."
      />
      <CoachProfileForm initialValues={coachProfileToFormInput(profile)} />
    </>
  )
}
