import "server-only"

import { isIP } from "node:net"

import { GEOIP_ENDPOINT } from "./config"

export interface GeoLocation {
  country: string | null
  region: string | null
  city: string | null
  latitude: number | null
  longitude: number | null
}

const EMPTY: GeoLocation = {
  country: null,
  region: null,
  city: null,
  latitude: null,
  longitude: null,
}

/**
 * Uses platform client-IP headers before the generic proxy chain. The host must
 * overwrite these headers at its trusted proxy; direct clients can spoof them.
 */
function normalizeIp(value: string | null) {
  const ip = value?.trim()
  if (!ip || ip.includes("%") || !isIP(ip)) return null
  if (isIP(ip) === 4) return ip
  const canonical = new URL(`http://[${ip}]/`).hostname.slice(1, -1)
  // IPv4-mapped IPv6 must receive the same private-range checks as IPv4.
  const mapped = /^::ffff:([\da-f]+):([\da-f]+)$/.exec(canonical)
  if (mapped) {
    const high = parseInt(mapped[1], 16)
    const low = parseInt(mapped[2], 16)
    return [high >> 8, high & 255, low >> 8, low & 255].join(".")
  }
  return canonical
}

export function clientIpFrom(headers: Headers) {
  for (const header of [
    "x-vercel-forwarded-for",
    "cf-connecting-ip",
    "x-forwarded-for",
    "x-real-ip",
  ]) {
    const ip = normalizeIp(headers.get(header)?.split(",")[0] ?? null)
    if (ip) return ip
  }
  return null
}

/** Loopback and private ranges — a local or intranet visitor has no public location. */
export function isPrivateIp(ip: string) {
  const normalized = normalizeIp(ip)
  if (!normalized) return true
  if (isIP(normalized) === 4) {
    const [first, second] = normalized.split(".").map(Number)
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      first >= 224 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 198 && (second === 18 || second === 19))
    )
  }
  return normalized === "::" || normalized === "::1" || /^(?:f[cd]|fe[89ab]|ff)/.test(normalized)
}

function decode(value: string | null) {
  if (!value) return null
  try {
    // Vercel percent-encodes city and region names ("New%20York").
    const decoded = decodeURIComponent(value).trim()
    return decoded.length > 0 ? decoded : null
  } catch {
    return value.trim() || null
  }
}

function toNumber(value: string | null, limit: number) {
  if (!value?.trim()) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && Math.abs(parsed) <= limit ? parsed : null
}

function countryCode(value: string | null) {
  const code = value?.toUpperCase()
  return code && /^[A-Z]{2}$/.test(code) && code !== "XX" ? code : null
}

/** Geo headers set by the hosting platform. Free and instant where they exist. */
export function geoFromHeaders(headers: Headers): GeoLocation {
  const country = decode(headers.get("x-vercel-ip-country") ?? headers.get("cf-ipcountry"))
  return {
    country: countryCode(country),
    region: decode(headers.get("x-vercel-ip-country-region")),
    city: decode(headers.get("x-vercel-ip-city")),
    latitude: toNumber(headers.get("x-vercel-ip-latitude"), 90),
    longitude: toNumber(headers.get("x-vercel-ip-longitude"), 180),
  }
}

// Repeat visitors and multi-page sessions would otherwise re-query the same IP.
const cache = new Map<string, { location: GeoLocation; expiresAt: number }>()
const CACHE_LIMIT = 5000
const CACHE_TTL_MS = 60 * 60 * 1000

/**
 * Falls back to a geo-IP service when the platform supplies no headers. Off
 * unless `ANALYTICS_GEOIP_ENDPOINT` is set, so visitor IPs are never handed to
 * a third party by default. Failures resolve to empty rather than throwing —
 * a missing city must never cost us the page view.
 */
async function lookup(ip: string): Promise<GeoLocation> {
  if (!GEOIP_ENDPOINT) return EMPTY

  const cached = cache.get(ip)
  if (cached && cached.expiresAt > Date.now()) return cached.location
  cache.delete(ip)

  try {
    const response = await fetch(GEOIP_ENDPOINT.replace("{ip}", encodeURIComponent(ip)), {
      signal: AbortSignal.timeout(2500),
      headers: { accept: "application/json" },
      cache: "no-store",
    })
    if (!response.ok) return EMPTY

    // Field names differ between providers; accept the common spellings.
    const body: Record<string, unknown> = await response.json()
    const pick = (...keys: string[]) => {
      for (const key of keys) {
        const value = body[key]
        if (typeof value === "string" && value.trim()) return value.trim()
        if (typeof value === "number") return String(value)
      }
      return null
    }

    const location: GeoLocation = {
      country: countryCode(pick("country_code", "countryCode", "country")),
      region: pick("region", "region_name", "regionName"),
      city: pick("city"),
      latitude: toNumber(pick("latitude", "lat"), 90),
      longitude: toNumber(pick("longitude", "lon", "lng"), 180),
    }

    if (cache.size >= CACHE_LIMIT) cache.delete(cache.keys().next().value!)
    cache.set(ip, { location, expiresAt: Date.now() + CACHE_TTL_MS })
    return location
  } catch {
    return EMPTY
  }
}

/** Platform headers first, then the optional lookup, then nothing. */
export async function resolveLocation(headers: Headers, ip: string | null): Promise<GeoLocation> {
  const fromHeaders = geoFromHeaders(headers)
  if (fromHeaders.country) return fromHeaders
  if (!ip || isPrivateIp(ip)) return fromHeaders
  const fallback = await lookup(ip)
  return {
    country: fromHeaders.country ?? fallback.country,
    region: fromHeaders.region ?? fallback.region,
    city: fromHeaders.city ?? fallback.city,
    latitude: fromHeaders.latitude ?? fallback.latitude,
    longitude: fromHeaders.longitude ?? fallback.longitude,
  }
}
