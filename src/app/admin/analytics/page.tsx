import { ActivityIcon } from "lucide-react"
import type { Metadata } from "next"
import Link from "next/link"

import { AdminHeader, EmptyState, Pagination } from "@/features/admin/components/admin-ui"
import { SearchInput } from "@/features/admin/components/search-input"
import { countExpiredPageViews } from "@/features/analytics/actions"
import { ActivityHeatmap } from "@/features/analytics/components/activity-heatmap"
import {
  LiveBadge,
  MetricTile,
  Panel,
  RangePicker,
} from "@/features/analytics/components/analytics-ui"
import { DeviceDonut } from "@/features/analytics/components/device-donut"
import { RetentionPanel } from "@/features/analytics/components/retention-panel"
import { StatBars } from "@/features/analytics/components/stat-bars"
import { TrafficChart } from "@/features/analytics/components/traffic-chart"
import { VisitorLog } from "@/features/analytics/components/visitor-log"
import { VisitorMap } from "@/features/analytics/components/visitor-map"
import {
  countryFlag,
  countryName,
  delta,
  formatDuration,
  formatPercent,
  full,
} from "@/features/analytics/lib/format"
import { GEOIP_ENDPOINT, RETENTION_DAYS } from "@/features/analytics/lib/config"
import {
  getAnalytics,
  getVisitorLog,
  isRangeKey,
  rangeWindow,
  RANGES,
  type RangeKey,
} from "@/features/analytics/queries"
import { toQueryString } from "@/features/admin/search-params"

export const metadata: Metadata = { title: "Analytics" }

const LOG_PAGE_SIZE = 25

export default async function AdminAnalyticsPage(props: PageProps<"/admin/analytics">) {
  const params = await props.searchParams
  const raw = (key: string) => {
    const value = params[key]
    return Array.isArray(value) ? value[0] : value
  }

  const range: RangeKey = isRangeKey(raw("range")) ? (raw("range") as RangeKey) : "30d"
  const includeBots = raw("bots") === "1"
  const parsedPage = Number(raw("page") ?? "1")
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1
  const search = (raw("q") ?? "").trim().slice(0, 100)
  const window = rangeWindow(range)

  const [data, log, expired] = await Promise.all([
    getAnalytics(range, includeBots, window),
    getVisitorLog(range, {
      page,
      perPage: LOG_PAGE_SIZE,
      search: search || undefined,
      includeBots,
    }, window),
    countExpiredPageViews(),
  ])

  const { current, previous } = data
  const hrefFor = (overrides: Record<string, string | number | undefined>) =>
    `/admin/analytics${toQueryString({
      range: range === "30d" ? undefined : range,
      bots: includeBots ? "1" : undefined,
      q: search || undefined,
      page: 1,
      ...overrides,
    })}`

  const totalViews = current.views

  return (
    <>
      <AdminHeader
        title="Analytics"
        description={`Traffic for the last ${RANGES[range].label}. Times shown in ${data.timezone}.`}
      >
        <div className="flex flex-wrap items-center gap-2">
          <LiveBadge visitors={data.live.visitors} />
          <Link
            href={hrefFor({ bots: includeBots ? undefined : "1" })}
            className="rounded-md px-2 py-1.5 text-xs whitespace-nowrap text-muted-foreground ring-1 ring-foreground/10 hover:text-foreground"
          >
            {includeBots ? "Hide bots" : "Show bots"}
          </Link>
          <RangePicker
            active={range}
            hrefFor={(key) => hrefFor({ range: key === "30d" ? undefined : key })}
          />
        </div>
      </AdminHeader>

      {totalViews === 0 && !includeBots ? (
        <EmptyState
          icon={ActivityIcon}
          title="No traffic in this period"
          description="Page views appear here as people visit the site. Choose a longer range to see older traffic. Visits to /admin are excluded."
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricTile
              label="Page views"
              value={full.format(current.views)}
              change={delta(current.views, previous.views)}
            />
            <MetricTile
              label="Unique visitors"
              value={full.format(current.visitors)}
              change={delta(current.visitors, previous.visitors)}
            />
            <MetricTile
              label="Sessions"
              value={full.format(current.sessions)}
              change={delta(current.sessions, previous.sessions)}
            />
            <MetricTile
              label="Avg. time on page"
              value={formatDuration(current.avgDurationMs)}
              change={delta(current.avgDurationMs, previous.avgDurationMs)}
            />
            <MetricTile
              label="Bounce rate"
              value={formatPercent(current.bounceRate, 0)}
              change={delta(current.bounceRate, previous.bounceRate)}
              lowerIsBetter
              hint="one-page sessions"
            />
            <MetricTile
              label="Views per session"
              value={current.viewsPerSession.toFixed(2)}
              change={delta(current.viewsPerSession, previous.viewsPerSession)}
            />
            <MetricTile
              label="New human visitors"
              value={full.format(data.newReturning.fresh)}
              change={null}
              hint={`${full.format(data.newReturning.returning)} returning · based on retained history`}
            />
            <MetricTile
              label="Bot requests"
              value={full.format(data.botSplit.bots)}
              change={null}
              hint={`${full.format(data.botSplit.humans)} human views`}
            />
          </div>

          <Panel
            title="Traffic over time"
            hint="Page views and unique visitors on one scale"
            action={
              <div className="flex items-center gap-3 text-xs">
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-chart-1" aria-hidden="true" />
                  Page views
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="size-2 rounded-full bg-chart-3" aria-hidden="true" />
                  Visitors
                </span>
              </div>
            }
          >
            <TrafficChart
              range={range}
              timezone={data.timezone}
              data={data.traffic.map(
                (point: { bucket: Date; views: number; visitors: number }) => ({
                  bucket: new Date(point.bucket).toISOString(),
                  views: point.views,
                  visitors: point.visitors,
                }),
              )}
            />
          </Panel>

          <Panel title="Where visitors are" hint="Approximate IP locations · up to 500 places, sized by page views">
            <VisitorMap points={data.mapPoints} />
          </Panel>

          <div className="grid gap-4 lg:grid-cols-2">
            <Panel title="Top pages" hint="Most viewed paths">
              <StatBars rows={data.pages} total={totalViews} />
            </Panel>
            <Panel title="Entry pages" hint="Where sessions began">
              <StatBars rows={data.entryPages} total={current.sessions} />
            </Panel>
            <Panel title="Referrers" hint="Where the traffic came from">
              <StatBars rows={data.referrers} total={totalViews} />
            </Panel>
            <Panel title="Campaigns" hint="From utm_source on the landing URL">
              <StatBars rows={data.campaigns} total={totalViews} emptyLabel="No tagged campaigns yet" />
            </Panel>
            <Panel title="Countries">
              <StatBars
                rows={data.countries}
                total={totalViews}
                renderLabel={(row) => (
                  <span className="flex items-center gap-2">
                    <span aria-hidden="true">{countryFlag(row.label)}</span>
                    {countryName(row.label)}
                  </span>
                )}
              />
            </Panel>
            <Panel title="Cities">
              <StatBars rows={data.cities} total={totalViews} emptyLabel="No city-level data yet" />
            </Panel>
            <Panel title="Devices" hint="Share of page views">
              <DeviceDonut rows={data.devices} />
            </Panel>
            <Panel title="Browsers">
              <StatBars rows={data.browsers} total={totalViews} />
            </Panel>
            <Panel title="Operating systems">
              <StatBars rows={data.operatingSystems} total={totalViews} />
            </Panel>
            <Panel title="Languages">
              <StatBars rows={data.languages} total={totalViews} />
            </Panel>
          </div>

          <Panel title="When people visit" hint="Page views by weekday and hour">
            <ActivityHeatmap data={data.heatmap} timezone={data.timezone} />
          </Panel>

          <Panel
            title="Visitor log"
            hint={`${full.format(log.total)} recorded visits, newest first`}
            action={
              <div className="flex items-center gap-2">
                <div className="w-44 sm:w-64">
                  <SearchInput label="Search visits" placeholder="IP, city, page…" />
                </div>
              </div>
            }
          >
            {log.rows.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No visits match this filter.
              </p>
            ) : (
              <>
                <VisitorLog rows={log.rows} timezone={data.timezone} />
                <Pagination
                  page={log.page}
                  pageCount={log.pageCount}
                  hrefFor={(next) => hrefFor({ page: next })}
                />
              </>
            )}
          </Panel>
        </div>
      )}
      <div className="mt-4">
        <RetentionPanel
          retentionDays={RETENTION_DAYS}
          expired={expired}
          geoEnabled={Boolean(GEOIP_ENDPOINT)}
        />
      </div>
    </>
  )
}
