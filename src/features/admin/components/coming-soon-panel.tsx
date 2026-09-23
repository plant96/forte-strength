"use client"

import { Loader2Icon, PlusIcon, SparklesIcon, Trash2Icon } from "lucide-react"
import { useState, useTransition } from "react"
import { toast } from "sonner"

import { SoonBadge } from "@/components/soon-badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { addComingSoonItem, removeComingSoonItem } from "@/features/coming-soon/actions"
import {
  COMING_SOON_TITLE_MAX,
  type ComingSoonKind,
  type ComingSoonNavItem,
} from "@/features/coming-soon/schema"

const LABELS: Record<ComingSoonKind, { title: string; blurb: string; placeholder: string }> = {
  tools: {
    title: "Tools",
    blurb: "Listed under Tools in the nav and on client dashboards, greyed out.",
    placeholder: "e.g. Meet Planner",
  },
  resources: {
    title: "Resources",
    blurb: "Listed under Resources in the nav and on client dashboards, greyed out.",
    placeholder: "e.g. Warm-up Library",
  },
}

/** One list of teasers with an inline add form. No confirm on remove: re-adding is one line. */
export function ComingSoonPanel({
  kind,
  items,
}: {
  kind: ComingSoonKind
  items: ComingSoonNavItem[]
}) {
  const [title, setTitle] = useState("")
  const [isAdding, startAdding] = useTransition()
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [, startRemoving] = useTransition()
  const labels = LABELS[kind]

  function add(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const trimmed = title.trim()
    if (!trimmed) return
    startAdding(async () => {
      const result = await addComingSoonItem({ kind, title: trimmed })
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      setTitle("")
      toast.success(`Added "${trimmed}"`)
    })
  }

  function remove(item: ComingSoonNavItem) {
    setRemovingId(item.id)
    startRemoving(async () => {
      const result = await removeComingSoonItem(item.id)
      setRemovingId(null)
      if (!result.ok) {
        toast.error(result.message)
        return
      }
      toast.success(`Removed "${item.title}"`)
    })
  }

  return (
    <section
      aria-labelledby={`coming-soon-${kind}`}
      className="flex flex-col rounded-2xl bg-card ring-1 ring-foreground/10"
    >
      <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
        <h2 id={`coming-soon-${kind}`} className="font-heading text-xl font-bold uppercase">
          {labels.title}
        </h2>
        <p className="text-sm text-muted-foreground">{labels.blurb}</p>
      </div>

      <ul className="flex flex-col divide-y divide-border">
        {items.length === 0 && (
          <li className="px-5 py-6 text-sm text-muted-foreground">Nothing announced yet.</li>
        )}
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-3 px-5 py-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
              <SparklesIcon className="size-4" />
            </span>
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <span className="truncate font-medium">{item.title}</span>
              <SoonBadge />
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Remove ${item.title}`}
              disabled={removingId === item.id}
              onClick={() => remove(item)}
              className="text-muted-foreground hover:text-destructive"
            >
              {removingId === item.id ? <Loader2Icon className="animate-spin" /> : <Trash2Icon />}
            </Button>
          </li>
        ))}
      </ul>

      <form onSubmit={add} className="flex gap-2 border-t border-border p-4">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder={labels.placeholder}
          maxLength={COMING_SOON_TITLE_MAX}
          aria-label={`New ${labels.title.toLowerCase()} teaser`}
          className="h-10"
        />
        <Button type="submit" disabled={isAdding || !title.trim()} className="h-10 shrink-0">
          {isAdding ? <Loader2Icon className="animate-spin" /> : <PlusIcon />}
          Add
        </Button>
      </form>
    </section>
  )
}
