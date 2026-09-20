"use client"

import { EraserIcon, ShieldIcon, Trash2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"

import { forgetAllIpAddresses, purgeExpiredPageViews } from "../actions"

export function RetentionPanel({
  retentionDays,
  expired,
  geoEnabled,
}: {
  retentionDays: number
  expired: number
  geoEnabled: boolean
}) {
  const [pending, startTransition] = useTransition()
  const [confirmOpen, setConfirmOpen] = useState(false)

  const run = (action: () => Promise<{ ok: boolean; message: string }>) =>
    startTransition(async () => {
      const result = await action()
      if (result.ok) toast.success(result.message)
      else toast.error(result.message)
    })

  return (
    <section className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-foreground/10">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-highlight">
          <ShieldIcon className="size-4.5" />
        </span>
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-sm font-semibold tracking-[0.15em] uppercase">
            Data &amp; retention
          </h2>
          <p className="text-sm text-muted-foreground">
            Visits older than <strong className="text-foreground">{retentionDays} days</strong> are
            removed by automatic cleanup. You can also purge expired visits now or clear stored IP
            addresses.
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="flex flex-col gap-0.5 rounded-lg bg-background/60 p-3">
          <dt className="text-xs text-muted-foreground">Past retention</dt>
          <dd className="font-heading text-xl font-bold tabular-nums">
            {expired.toLocaleString("en-US")}
          </dd>
        </div>
        <div className="flex flex-col gap-0.5 rounded-lg bg-background/60 p-3">
          <dt className="text-xs text-muted-foreground">Location lookups</dt>
          <dd className="font-heading text-xl font-bold">{geoEnabled ? "On" : "Headers only"}</dd>
        </div>
      </dl>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={pending || expired === 0}
          onClick={() => run(purgeExpiredPageViews)}
        >
          <Trash2Icon />
          Purge expired
        </Button>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button type="button" variant="destructive" size="sm" disabled={pending}>
              <EraserIcon />
              Forget all IPs
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear every stored IP address?</AlertDialogTitle>
              <AlertDialogDescription>
                Visit counts, locations and every chart stay exactly as they are — only the raw IP
                addresses are erased, from all visits, permanently. Future visits can record new IP
                addresses.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setConfirmOpen(false)
                  run(forgetAllIpAddresses)
                }}
              >
                Erase IP addresses
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </section>
  )
}
