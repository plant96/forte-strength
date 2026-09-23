import { ShieldCheckIcon } from "lucide-react"
import type { Metadata } from "next"

import { AdminNav } from "@/features/admin/components/admin-nav"
import { getAdminCounts } from "@/features/admin/queries"
import { requireAdmin } from "@/server/auth"

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s | Admin" },
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  await requireAdmin()
  const counts = await getAdminCounts()

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-10">
        <aside className="flex shrink-0 flex-col gap-4 lg:sticky lg:top-24 lg:w-56 lg:self-start">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-lg bg-primary/15 text-highlight ring-1 ring-primary/30">
              <ShieldCheckIcon className="size-5" />
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-heading text-lg font-bold uppercase">Admin</span>
              <span className="text-xs text-muted-foreground">Coach dashboard</span>
            </div>
          </div>
          <AdminNav
            badges={{
              "/admin/applications": counts.unprocessed,
              "/admin/bug-reports": counts.bugReports,
            }}
          />
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </div>
  )
}
