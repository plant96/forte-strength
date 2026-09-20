import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { getUserDetail } from "@/features/admin/queries"
import { displayName } from "@/features/admin/components/user-badges"
import { SeriesPage } from "@/features/pr-tracker/components/view/series-page"
import { parseSeriesKey } from "@/features/pr-tracker/lib/series"
import { getLiftUnit, getSeriesDetail } from "@/features/pr-tracker/queries"
import { requireAdmin } from "@/server/auth"

export const metadata: Metadata = { title: "Client PR", robots: { index: false } }

type Props = PageProps<"/admin/users/[id]/prs/[exercise]/[series]">

export default async function AdminClientSeriesPage(props: Props) {
  await requireAdmin()
  const { id, exercise: slug, series: key } = await props.params

  const shape = parseSeriesKey(key)
  if (!shape) notFound()

  const user = await getUserDetail(id)
  if (!user) notFound()

  const detail = await getSeriesDetail(user.id, slug, shape)
  if (!detail) notFound()

  const unit = await getLiftUnit(user.id)

  return (
    <SeriesPage
      exercise={detail.exercise}
      shape={shape}
      series={detail.series}
      unit={unit}
      basePath={`/admin/users/${user.id}/prs`}
      backLabel={`Back to ${displayName(user)}'s PRs`}
      athleteId={user.id}
    />
  )
}
