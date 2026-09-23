"use client"

import { useOptimistic, useTransition } from "react"
import { toast } from "sonner"

import { Switch } from "@/components/ui/switch"

import { setNotificationEnabled } from "../actions"

/** One on/off switch. Flips immediately and rolls back if the save fails. */
export function NotificationToggle({
  keyName,
  label,
  enabled,
}: {
  keyName: string
  label: string
  enabled: boolean
}) {
  const [pending, startSaving] = useTransition()
  const [optimistic, setOptimistic] = useOptimistic(enabled)

  function toggle(next: boolean) {
    startSaving(async () => {
      setOptimistic(next)
      const result = await setNotificationEnabled(keyName, next)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(`${label}: ${next ? "on" : "off"}`)
    })
  }

  return (
    <Switch checked={optimistic} onCheckedChange={toggle} disabled={pending} aria-label={label} />
  )
}
