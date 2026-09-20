"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { isExcludedPath } from "../lib/config"

const ENDPOINT = "/api/collect"
const MAX_DURATION_MS = 6 * 60 * 60 * 1000

/**
 * Records a page view on every navigation, then reports how long the visitor
 * stayed once the page is hidden.
 *
 * The view request is a normal `fetch` because we need the id it returns; the
 * duration report is `sendBeacon`, which survives the page being torn down
 * where a `fetch` would be cancelled.
 */
export function AnalyticsBeacon() {
  const pathname = usePathname()
  const previousUrl = useRef<string | null>(null)
  // Let the first response set visitor/session cookies before the next view.
  const requestQueue = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    if (isExcludedPath(pathname)) {
      previousUrl.current = window.location.href
      return
    }

    let ended = false
    let viewId: string | null = null
    let visibleSince = document.visibilityState === "visible" ? performance.now() : null
    let visibleMs = 0
    let lastReportedMs = 0

    function pauseTimer() {
      if (visibleSince !== null) {
        visibleMs += performance.now() - visibleSince
        visibleSince = null
      }
    }

    function reportDuration() {
      const durationMs = Math.min(MAX_DURATION_MS, Math.round(visibleMs))
      if (!viewId || durationMs <= lastReportedMs) return
      lastReportedMs = durationMs
      const body = JSON.stringify({ type: "duration", id: viewId, durationMs })
      // Falls back to fetch+keepalive where sendBeacon is unavailable or refused.
      if (!navigator.sendBeacon?.(ENDPOINT, new Blob([body], { type: "application/json" }))) {
        void fetch(ENDPOINT, {
          method: "POST",
          body,
          headers: { "content-type": "application/json" },
          keepalive: true,
        }).catch(() => {})
      }
    }

    // Hidden, not unloaded: `pagehide`/`visibilitychange` are the only events
    // that fire reliably on mobile, where tabs are frozen rather than closed.
    function onHide() {
      pauseTimer()
      reportDuration()
    }

    function onShow() {
      if (!ended && document.visibilityState === "visible" && visibleSince === null) {
        visibleSince = performance.now()
      }
    }

    function onVisibilityChange() {
      if (document.visibilityState === "hidden") onHide()
      else onShow()
    }

    // Deferring one microtask avoids duplicate requests during Strict Mode's
    // setup/cleanup replay. Each real navigation owns its own duration state.
    queueMicrotask(() => {
      if (ended) return
      const body = JSON.stringify({
        type: "view",
        path: (window.location.pathname + window.location.search).slice(0, 2048),
        title: document.title.slice(0, 300) || null,
        referrer: (previousUrl.current ?? document.referrer).slice(0, 2048) || null,
        screenW: window.screen?.width ?? null,
        screenH: window.screen?.height ?? null,
        viewportW: window.innerWidth,
        viewportH: window.innerHeight,
        language: navigator.language || null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || null,
      })
      previousUrl.current = window.location.href
      requestQueue.current = requestQueue.current.then(async () => {
        try {
          const response = await fetch(ENDPOINT, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body,
            keepalive: true,
          })
          if (!response.ok || response.status === 204) return
          const result: { id?: string } = await response.json()
          viewId = result.id ?? null
          // A fast navigation or hide may precede the server acknowledgement.
          // Report this view's saved duration even after its effect has ended.
          if (ended || visibleSince === null) reportDuration()
        } catch {
          // Analytics failures never interrupt the page or the next view.
        }
      })
    })

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("pagehide", onHide)
    window.addEventListener("pageshow", onShow)

    return () => {
      ended = true
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("pagehide", onHide)
      window.removeEventListener("pageshow", onShow)
      // Navigating away within the app still ends this view.
      onHide()
    }
  }, [pathname])

  return null
}
