import { describe, expect, it } from "vitest"

import { isBotAgent, parseBrowser, parseDevice, parseOs } from "./user-agent"

const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"
const SAFARI_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15"
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1"
const EDGE =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0"
const CHROME_ANDROID =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36"
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"

describe("parseBrowser", () => {
  it("reads the common browsers", () => {
    expect(parseBrowser(CHROME_WIN)).toBe("Chrome")
    expect(parseBrowser(SAFARI_MAC)).toBe("Safari")
    expect(parseBrowser(SAFARI_IPHONE)).toBe("Safari")
  })

  // Every Chromium browser claims to be Chrome and Safari, so order decides.
  it("picks the impostor over what it impersonates", () => {
    expect(parseBrowser(EDGE)).toBe("Edge")
    expect(parseBrowser(`${CHROME_WIN} OPR/115.0.0.0`)).toBe("Opera")
    expect(parseBrowser(`${CHROME_ANDROID} SamsungBrowser/25.0`)).toBe("Samsung Internet")
  })

  it("falls back rather than guessing", () => {
    expect(parseBrowser("")).toBe("Unknown")
    expect(parseBrowser("something-nobody-has-seen")).toBe("Unknown")
  })
})

describe("parseOs", () => {
  it("reads the platform", () => {
    expect(parseOs(CHROME_WIN)).toBe("Windows")
    expect(parseOs(SAFARI_MAC)).toBe("macOS")
    expect(parseOs(SAFARI_IPHONE)).toBe("iOS")
    expect(parseOs(CHROME_ANDROID)).toBe("Android")
    expect(parseOs("")).toBe("Unknown")
  })

  // Android's UA also contains "Linux", so the more specific match must win.
  it("prefers Android over the Linux it also claims", () => {
    expect(parseOs(CHROME_ANDROID)).not.toBe("Linux")
  })
})

describe("parseDevice", () => {
  it("classifies phones, tablets and desktops", () => {
    expect(parseDevice(CHROME_WIN)).toBe("DESKTOP")
    expect(parseDevice(SAFARI_IPHONE)).toBe("MOBILE")
    expect(parseDevice(CHROME_ANDROID)).toBe("MOBILE")
    expect(parseDevice("Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) Safari/604.1")).toBe("TABLET")
  })

  it("flags bots before anything else", () => {
    expect(parseDevice(GOOGLEBOT)).toBe("BOT")
  })

  // iPadOS has reported a desktop UA since 13, so width is the only signal left.
  it("uses the viewport to break a tie the user agent can't", () => {
    expect(parseDevice(SAFARI_MAC, 800)).toBe("TABLET")
    expect(parseDevice(SAFARI_MAC, 500)).toBe("MOBILE")
    expect(parseDevice(SAFARI_MAC, 1512)).toBe("DESKTOP")
  })

  it("is UNKNOWN with nothing to go on", () => {
    expect(parseDevice("")).toBe("UNKNOWN")
  })
})

describe("isBotAgent", () => {
  it("catches crawlers, tools and preview fetchers", () => {
    for (const ua of [
      GOOGLEBOT,
      "curl/8.4.0",
      "python-requests/2.31.0",
      "facebookexternalhit/1.1",
      "Mozilla/5.0 (compatible; bingbot/2.0)",
      "GPTBot/1.0",
      "node-fetch/1.0",
    ]) {
      expect(isBotAgent(ua), ua).toBe(true)
    }
  })

  it("leaves real browsers alone", () => {
    for (const ua of [CHROME_WIN, SAFARI_MAC, SAFARI_IPHONE, EDGE, CHROME_ANDROID]) {
      expect(isBotAgent(ua), ua).toBe(false)
    }
  })
})
