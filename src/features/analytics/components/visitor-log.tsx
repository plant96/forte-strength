import { BotIcon, MonitorIcon, SmartphoneIcon, TabletIcon, UserRoundIcon } from "lucide-react"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { countryFlag, countryName, formatDuration } from "../lib/format"
import type { VisitorLogRow } from "../queries"

const DEVICE_ICONS = {
  DESKTOP: MonitorIcon,
  MOBILE: SmartphoneIcon,
  TABLET: TabletIcon,
  BOT: BotIcon,
  UNKNOWN: UserRoundIcon,
} as const

function time(value: Date, timezone: string) {
  return new Date(value).toLocaleString("en-US", {
    timeZone: timezone,
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  })
}

/** Short, stable handle for an anonymous visitor cookie. */
function shortId(value: string) {
  return value.slice(0, 8)
}

/**
 * The raw visit log: one row per page view, with everything we captured about
 * the visitor. Deliberately not joined to accounts — this is traffic, not
 * customers.
 */
export function VisitorLog({
  rows,
  timezone = "UTC",
}: {
  rows: VisitorLogRow[]
  timezone?: string
}) {
  return (
    <>
      {/* Table on wide screens. */}
      <div className="hidden overflow-x-auto rounded-2xl bg-card ring-1 ring-foreground/10 lg:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>When</TableHead>
              <TableHead>Visitor</TableHead>
              <TableHead>IP address</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>Page</TableHead>
              <TableHead>Referrer</TableHead>
              <TableHead>Device</TableHead>
              <TableHead className="text-right">Time on page</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => {
              const Icon = DEVICE_ICONS[row.device as keyof typeof DEVICE_ICONS] ?? UserRoundIcon
              return (
                <TableRow key={row.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {time(row.createdAt, timezone)}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-xs" title={row.visitorId}>
                      {shortId(row.visitorId)}
                    </span>
                    {row.isBot && (
                      <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[0.65rem] text-muted-foreground">
                        bot
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {row.ipAddress ?? <span className="text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {row.country ? (
                      <span title={`${row.city ?? "Unknown city"}, ${countryName(row.country)}`}>
                        <span aria-hidden="true">{countryFlag(row.country)}</span>{" "}
                        {row.city ?? countryName(row.country)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Unknown</span>
                    )}
                  </TableCell>
                  <TableCell className="max-w-56 truncate" title={row.path}>
                    {row.path}
                  </TableCell>
                  <TableCell className="max-w-40 truncate text-muted-foreground">
                    {row.referrerHost ?? "Direct"}
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    <span
                      className="flex items-center gap-1.5"
                      title={`${row.browser ?? "Unknown browser"} on ${row.os ?? "unknown OS"}${
                        row.screenW ? ` · ${row.screenW}×${row.screenH}` : ""
                      }`}
                    >
                      <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                      {row.browser ?? "Unknown"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap tabular-nums">
                    {row.durationMs !== null ? (
                      formatDuration(row.durationMs)
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Cards on narrow screens, where eight columns can't fit honestly. */}
      <ul className="flex flex-col gap-2 lg:hidden">
        {rows.map((row) => {
          const Icon = DEVICE_ICONS[row.device as keyof typeof DEVICE_ICONS] ?? UserRoundIcon
          return (
            <li key={row.id} className="rounded-2xl bg-card p-4 ring-1 ring-foreground/10">
              <div className="flex items-start justify-between gap-3">
                <span className="truncate font-medium">{row.path}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {time(row.createdAt, timezone)}
                </span>
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Visitor</dt>
                  <dd className="font-mono" title={row.visitorId}>
                    {shortId(row.visitorId)}{row.isBot ? " · bot" : ""}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Time on page</dt>
                  <dd>{row.durationMs !== null ? formatDuration(row.durationMs) : "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">IP</dt>
                  <dd className="font-mono">{row.ipAddress ?? "—"}</dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Location</dt>
                  <dd>
                    {row.country
                      ? `${countryFlag(row.country)} ${row.city ?? countryName(row.country)}`
                      : "Unknown"}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Device</dt>
                  <dd className="flex items-center gap-1.5">
                    <Icon className="size-3.5 text-muted-foreground" aria-hidden="true" />
                    {row.browser ?? "Unknown"} · {row.os ?? "—"}
                  </dd>
                </div>
                <div className="flex flex-col">
                  <dt className="text-muted-foreground">Referrer</dt>
                  <dd className="truncate">{row.referrerHost ?? "Direct"}</dd>
                </div>
              </dl>
            </li>
          )
        })}
      </ul>
    </>
  )
}
