import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { CoachingCta } from "@/components/marketing/coaching-cta"
import { getResourceLift, LIFT_SLUGS } from "@/features/resources/data"
import { ResourceVault } from "@/features/resources/components/resource-vault"

/** The three pages are the whole vault — anything else is a 404, not a render. */
export const dynamicParams = false

export function generateStaticParams() {
  return LIFT_SLUGS.map((lift) => ({ lift }))
}

export async function generateMetadata({
  params,
}: PageProps<"/resources/[lift]">): Promise<Metadata> {
  const lift = getResourceLift((await params).lift)
  if (!lift) return {}

  const title = `${lift.title} Mobility & Warm-Up`
  return {
    title,
    description: lift.description,
    alternates: { canonical: `/resources/${lift.slug}` },
    openGraph: {
      title: `${title} | Forte Strength Systems`,
      description: lift.description,
      url: `/resources/${lift.slug}`,
    },
  }
}

export default async function ResourcePage({ params }: PageProps<"/resources/[lift]">) {
  const lift = getResourceLift((await params).lift)
  if (!lift) notFound()

  return (
    <>
      <ResourceVault lift={lift} />
      <div className="mx-auto w-full max-w-6xl px-4 pt-4 pb-16 sm:px-6 sm:pb-24">
        <CoachingCta />
      </div>
    </>
  )
}
