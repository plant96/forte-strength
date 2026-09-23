import { z } from "zod"

import type { ComingSoonKind as DbComingSoonKind } from "@/generated/prisma/client"

/** Which dashboard/nav list a teaser belongs to. */
export type ComingSoonKind = "tools" | "resources"

export const COMING_SOON_KINDS = ["tools", "resources"] as const satisfies readonly ComingSoonKind[]

export const COMING_SOON_KIND_TO_DB: Record<ComingSoonKind, DbComingSoonKind> = {
  tools: "TOOL",
  resources: "RESOURCE",
}

export const COMING_SOON_KIND_FROM_DB: Record<DbComingSoonKind, ComingSoonKind> = {
  TOOL: "tools",
  RESOURCE: "resources",
}

export const COMING_SOON_TITLE_MAX = 60

export interface ComingSoonNavItem {
  id: string
  title: string
}

/** Teasers grouped by the list they appear in. Both lists may be empty. */
export interface ComingSoonLists {
  tools: ComingSoonNavItem[]
  resources: ComingSoonNavItem[]
}

export const EMPTY_COMING_SOON: ComingSoonLists = { tools: [], resources: [] }

export const comingSoonSchema = z.object({
  kind: z.enum(COMING_SOON_KINDS),
  title: z
    .string()
    .trim()
    .min(1, "Enter a title")
    .max(COMING_SOON_TITLE_MAX, `Titles are ${COMING_SOON_TITLE_MAX} characters or fewer`),
})

export type ComingSoonInput = z.input<typeof comingSoonSchema>
