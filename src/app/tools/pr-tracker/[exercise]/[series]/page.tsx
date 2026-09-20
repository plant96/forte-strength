import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { SeriesPage } from "@/features/pr-tracker/components/view/series-page"
import { parseSeriesKey, seriesTitle } from "@/features/pr-tracker/lib/series"
import { getLiftUnit, getSeriesDetail } from "@/features/pr-tracker/queries"
import { getClientAreaUser } from "@/server/auth"

type Props = PageProps<"/tools/pr-tracker/[exercise]/[series]">

async function load(props: Props) {
  const { exercise: slug, series: key } = await props.params
  const shape = parseSeriesKey(key)
  if (!shape) return null

  const user = await getClientAreaUser()
  if (!user) return null

  const detail = await getSeriesDetail(user.id, slug, shape)
  if (!detail) return null

  return { ...detail, userId: user.id }
}

export async function generateMetadata(props: Props): Promise<Metadata> {
  const data = await load(props)
  if (!data) return { title: "Record not found" }

  return {
    title: seriesTitle(data.exercise.name, data.series),
    robots: { index: false },
  }
}

export default async function PrSeriesPage(props: Props) {
  const data = await load(props)
  if (!data) notFound()

  const unit = await getLiftUnit(data.userId)

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 sm:py-14">
      <SeriesPage
        exercise={data.exercise}
        series={data.series}
        unit={unit}
        basePath="/tools/pr-tracker?panel=view"
        backLabel="Back to your PRs"
      />
    </div>
  )
}
