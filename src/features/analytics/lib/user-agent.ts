import type { DeviceType } from "@/generated/prisma/enums"

/**
 * A deliberately small user-agent reader. Full UA parsing is a losing game —
 * this covers the browsers and platforms that actually show up in traffic and
 * falls back to "Unknown" rather than guessing.
 */

const BOT_PATTERNS = [
  "bot",
  "crawl",
  "spider",
  "slurp",
  "facebookexternalhit",
  "embedly",
  "quora link preview",
  "pinterest",
  "vkshare",
  "preview",
  "scrape",
  "fetch",
  "curl",
  "wget",
  "python-requests",
  "axios",
  "headless",
  "lighthouse",
  "pagespeed",
  "gtmetrix",
  "pingdom",
  "uptime",
  "monitor",
  "validator",
  "postman",
  "insomnia",
  "go-http-client",
  "java/",
  "okhttp",
  "phantomjs",
  "puppeteer",
  "playwright",
  "chatgpt",
  "gptbot",
  "claudebot",
  "anthropic",
  "perplexity",
  "applebot",
]

export function isBotAgent(ua: string) {
  const value = ua.toLowerCase()
  return BOT_PATTERNS.some((pattern) => value.includes(pattern))
}

/** Ordered: the first match wins, so impostors are listed before what they impersonate. */
const BROWSERS: [name: string, pattern: RegExp][] = [
  ["Edge", /edg(?:e|a|ios)?\//i],
  ["Opera", /opr\/|opera/i],
  ["Samsung Internet", /samsungbrowser/i],
  ["Brave", /brave/i],
  ["Vivaldi", /vivaldi/i],
  ["Firefox", /firefox\/|fxios/i],
  ["Chrome", /chrome\/|crios/i],
  ["Safari", /safari\//i],
]

export function parseBrowser(ua: string) {
  return BROWSERS.find(([, pattern]) => pattern.test(ua))?.[0] ?? "Unknown"
}

const OPERATING_SYSTEMS: [name: string, pattern: RegExp][] = [
  ["iOS", /iphone|ipad|ipod/i],
  ["Android", /android/i],
  ["Windows", /windows nt/i],
  ["macOS", /macintosh|mac os x/i],
  ["ChromeOS", /cros/i],
  ["Linux", /linux/i],
]

export function parseOs(ua: string) {
  return OPERATING_SYSTEMS.find(([, pattern]) => pattern.test(ua))?.[0] ?? "Unknown"
}

/**
 * Device class. The viewport width is the tiebreaker when the UA is ambiguous:
 * iPads have reported a desktop UA since iPadOS 13, so width is the only
 * honest signal left.
 */
export function parseDevice(ua: string, viewportWidth?: number | null): DeviceType {
  if (isBotAgent(ua)) return "BOT"
  if (/ipad|tablet|playbook|silk/i.test(ua)) return "TABLET"
  if (/mobi|iphone|ipod|android.*mobile|windows phone/i.test(ua)) return "MOBILE"
  if (/android/i.test(ua)) return "TABLET"
  if (!ua) return "UNKNOWN"
  if (viewportWidth) {
    if (viewportWidth < 640) return "MOBILE"
    if (viewportWidth < 1024) return "TABLET"
  }
  return "DESKTOP"
}
