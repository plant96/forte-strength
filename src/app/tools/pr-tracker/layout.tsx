import type { Metadata } from "next"

import { ClientOnlyGate } from "@/components/layout/client-only-gate"
import { canAccessClientArea, getCurrentUser } from "@/server/auth"

const description =
  "Log every personal record and watch the line climb. A graph for each lift and rep scheme, kept for as long as you train."

export const metadata: Metadata = {
  title: "PR Tracker",
  description,
  alternates: { canonical: "/tools/pr-tracker" },
  openGraph: {
    title: "PR Tracker | Forte Strength Systems",
    description,
    url: "/tools/pr-tracker",
  },
}

/**
 * The gate for the whole tool, so the panel page and every series page below it are
 * covered by one check. Non-clients get the upsell at the same URL — the records
 * themselves are never queried, let alone rendered.
 */
export default async function PrTrackerLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!canAccessClientArea(user)) {
    return <ClientOnlyGate feature="pr-tracker" signedIn={Boolean(user)} />
  }
  return children
}
