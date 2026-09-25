"use client"

import { CheckIcon, CopyIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"

type CopyStatus = "idle" | "copied" | "failed"

/** Copies the plain-text version of a breakdown to the clipboard. */
export function CopyBreakdownButton({ getText }: { getText: () => string }) {
  const [status, setStatus] = useState<CopyStatus>("idle")

  useEffect(() => {
    if (status === "idle") return
    const timeout = window.setTimeout(() => setStatus("idle"), 2000)
    return () => window.clearTimeout(timeout)
  }, [status])

  async function copy() {
    try {
      await navigator.clipboard.writeText(getText())
      setStatus("copied")
    } catch {
      setStatus("failed")
    }
  }

  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} aria-live="polite">
      {status === "copied" ? <CheckIcon /> : status === "failed" ? <XIcon /> : <CopyIcon />}
      {status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy breakdown"}
    </Button>
  )
}
