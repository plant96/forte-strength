export type ApplicationStatusFilter = "unprocessed" | "processed" | "all"

export const PAGE_SIZE = 20

type RawSearchParams = Record<string, string | string[] | undefined>

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value
}

export function parseApplicationFilters(params: RawSearchParams) {
  const status = first(params.status)
  const page = Number.parseInt(first(params.page) ?? "1", 10)
  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    status: (status === "processed" || status === "all"
      ? status
      : "unprocessed") as ApplicationStatusFilter,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export type BugReportStatusFilter = "open" | "archived"

export function parseBugReportFilters(params: RawSearchParams) {
  const page = Number.parseInt(first(params.page) ?? "1", 10)
  return {
    status: (first(params.status) === "archived" ? "archived" : "open") as BugReportStatusFilter,
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

export function parseUserFilters(params: RawSearchParams) {
  const page = Number.parseInt(first(params.page) ?? "1", 10)
  return {
    q: (first(params.q) ?? "").trim().slice(0, 100),
    page: Number.isFinite(page) && page > 0 ? page : 1,
  }
}

/** Builds a query string, dropping empty/default values. */
export function toQueryString(values: Record<string, string | number | undefined>) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === "" || (key === "page" && value === 1)) continue
    params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `?${query}` : ""
}
