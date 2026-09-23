import "server-only"

import { cache } from "react"

import { db } from "@/server/db"

import { COMING_SOON_KIND_FROM_DB, type ComingSoonLists } from "./schema"

/** Every teaser, oldest first, grouped by the list it belongs to. Deduplicated per request. */
export const listComingSoon = cache(async (): Promise<ComingSoonLists> => {
  const rows = await db.comingSoonItem.findMany({
    orderBy: { createdAt: "asc" },
    select: { id: true, kind: true, title: true },
  })
  const lists: ComingSoonLists = { tools: [], resources: [] }
  for (const row of rows) {
    lists[COMING_SOON_KIND_FROM_DB[row.kind]].push({ id: row.id, title: row.title })
  }
  return lists
})
