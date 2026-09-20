import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ResourceVault } from "@/features/resources/components/resource-vault"
import { getResourceLift, LIFT_SLUGS, liftHref } from "@/features/resources/data"
import { hasClientAreaAccess } from "@/server/auth"

/** The three lifts are the whole vault — anything else is a 404, not a render. */
export const dynamicParams = false

export function generateStaticParams() {
  return LIFT_SLUGS.map((lift) => ({ lift }))
}

export async function generateMetadata({
  params,
}: PageProps<"/resources/mobility-vault/[lift]">): Promise<Metadata> {
  const lift = getResourceLift((await params).lift)
  if (!lift) return {}

  const title = `${lift.title} · Mobility Vault`
  const url = liftHref(lift.slug)
  return {
    title,
    description: lift.description,
    alternates: { canonical: url },
    openGraph: {
      title: `${title} | Forte Strength Systems`,
      description: lift.description,
      url,
    },
  }
}

/**
 * The layout renders the upsell, but this page has to bail out for itself too: Next
 * renders page segments independently of whether the parent layout includes `children`,
 * so a layout-only check still ships the real content in the RSC payload. Returning null
 * means there is nothing to ship, and the layout's gate is what the visitor sees.
 */
export default async function MobilityVaultLiftPage({
  params,
}: PageProps<"/resources/mobility-vault/[lift]">) {
  if (!(await hasClientAreaAccess())) return null

  const lift = getResourceLift((await params).lift)
  if (!lift) notFound()

  return <ResourceVault lift={lift} />
}
