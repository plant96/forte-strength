import type { Metadata } from "next"

import { AdminHeader } from "@/features/admin/components/admin-ui"
import { ComingSoonPanel } from "@/features/admin/components/coming-soon-panel"
import { listComingSoon } from "@/features/coming-soon/queries"

export const metadata: Metadata = { title: "Coming soon" }

export default async function AdminComingSoonPage() {
  const items = await listComingSoon()

  return (
    <>
      <AdminHeader
        title="Coming soon"
        description="Titles shown as unclickable teasers in the nav and on client dashboards. Only clients and admins see them."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <ComingSoonPanel kind="tools" items={items.tools} />
        <ComingSoonPanel kind="resources" items={items.resources} />
      </div>
    </>
  )
}
